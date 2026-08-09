import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * 验证码存储项
 */
interface CodeEntry {
  code: string;
  expireAt: number;
  resendAvailableAt: number; // 下次可发送时间（防刷）
}

/**
 * 短信验证码服务
 *
 * 设计说明：
 * - 接入腾讯云 SMS SDK 发送验证码
 * - 验证码使用内存 Map 存储（5 分钟有效期），适合单实例部署
 *   多实例部署可改用 Redis（通过 REDIS_HOST/REDIS_PORT 配置）
 * - 同一手机号 60 秒内仅可发送一次（防刷）
 * - SMS 密钥未配置时：
 *   - 开发环境（NODE_ENV !== 'production'）：降级为控制台打印验证码
 *   - 生产环境：抛出异常，拒绝发送
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly store = new Map<string, CodeEntry>();
  private readonly CODE_TTL_MS = 5 * 60 * 1000; // 5 分钟
  private readonly RESEND_INTERVAL_MS = 60 * 1000; // 60 秒防刷
  /** 模板中 {2} 提示用户填写验证码的剩余有效分钟数（与 CODE_TTL_MS 对应） */
  private readonly EXPIRE_MINUTES = 5;

  /**
   * 发送验证码到指定手机号
   * @returns 验证码（开发模式下返回，生产模式返回 null）
   */
  async sendCode(phone: string): Promise<{ sent: boolean; devCode?: string }> {
    if (!this.isConfigured()) {
      if (this.isProduction()) {
        this.logger.error(`SMS 配置缺失，生产环境拒绝发送验证码到 ${phone}`);
        throw new BadRequestException('短信服务未配置，请联系管理员');
      }
      // 开发环境降级：生成验证码并打印到控制台
      const code = this.generateCode();
      this.saveCode(phone, code);
      this.logger.warn(
        `[DEV MODE] SMS 配置缺失，验证码未真实发送。手机号：${phone}，验证码：${code}`,
      );
      return { sent: true, devCode: code };
    }

    // 防刷检查
    const existing = this.store.get(phone);
    const now = Date.now();
    if (existing && now < existing.resendAvailableAt) {
      const waitSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
      throw new BadRequestException(`发送过于频繁，请 ${waitSec} 秒后再试`);
    }

    const code = this.generateCode();
    await this.sendViaTencentCloud(phone, code);
    this.saveCode(phone, code);
    this.logger.log(`验证码已发送至 ${phone}`);
    return { sent: true };
  }

  /**
   * 校验验证码（一次性，校验成功或失败后均清除）
   */
  verify(phone: string, code: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) return false;
    if (Date.now() > entry.expireAt) {
      this.store.delete(phone);
      return false;
    }
    // 无论成功失败都清除，防止暴力枚举
    this.store.delete(phone);
    return entry.code === code;
  }

  /**
   * SMS 配置是否就绪
   */
  private isConfigured(): boolean {
    return !!(
      process.env.SMS_SDK_APP_ID &&
      process.env.SMS_APP_KEY &&
      process.env.SMS_SECRET_ID &&
      process.env.SMS_SECRET_KEY &&
      process.env.SMS_SIGN_NAME &&
      process.env.SMS_TEMPLATE_ID
    );
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private generateCode(): string {
    // 6 位数字验证码
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private saveCode(phone: string, code: string): void {
    const now = Date.now();
    this.store.set(phone, {
      code,
      expireAt: now + this.CODE_TTL_MS,
      resendAvailableAt: now + this.RESEND_INTERVAL_MS,
    });
  }

  /**
   * 通过腾讯云 SMS SDK 发送验证码
   * SDK 文档：https://cloud.tencent.com/document/product/382/43196
   */
  private async sendViaTencentCloud(phone: string, code: string): Promise<void> {
    // 动态引入，避免在 SDK 未安装时启动失败
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: process.env.SMS_SECRET_ID!,
        secretKey: process.env.SMS_SECRET_KEY!,
      },
      region: 'ap-guangzhou',
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
          reqTimeout: 10,
        },
      },
    });

    const SendStatusCallback = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: process.env.SMS_SDK_APP_ID!,
      SignName: process.env.SMS_SIGN_NAME!,
      TemplateId: process.env.SMS_TEMPLATE_ID!,
      // 模板参数顺序需与腾讯云后台模板一致：
      // {1} 验证码，{2} 有效分钟数
      TemplateParamSet: [code, String(this.EXPIRE_MINUTES)],
    };

    try {
      const resp = await client.SendSms(SendStatusCallback);
      const status = resp?.SendStatusSet?.[0];
      if (status?.Code !== 'Ok') {
        this.logger.error(
          `腾讯云 SMS 发送失败：${status?.Code} - ${status?.Message}`,
        );
        throw new BadRequestException(
          `短信发送失败：${status?.Message || '未知错误'}`,
        );
      }
    } catch (err: any) {
      // SDK 抛出的异常
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`腾讯云 SMS 调用异常：${err.message}`);
      throw new BadRequestException('短信发送失败，请稍后重试');
    }
  }
}
