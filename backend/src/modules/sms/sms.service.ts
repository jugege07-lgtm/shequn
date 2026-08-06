import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * 验证码存储项
 */
interface CodeEntry {
  code: string;
  expireAt: number; // 过期时间戳（ms）
  resendAvailableAt: number; // 下次可发送时间（防刷，ms）
  scene: string;
}

/**
 * 每日发送计数项
 */
interface DailyCounter {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * 短信验证码服务
 *
 * 设计说明：
 * - 接入腾讯云 SMS SDK（tencentcloud-sdk-nodejs-sms）发送验证码
 * - 验证码使用内存 Map 存储（默认 5 分钟有效期），按 phone:scene 隔离，适合单实例部署
 *   多实例/集群部署建议改用 Redis（通过 REDIS_HOST/REDIS_PORT 配置）
 * - 防刷策略：
 *   1) 同一手机号 + 同一场景 60 秒内仅可发送一次
 *   2) 同一手机号每日发送上限（默认 10 次）
 * - 验证码一次性：校验通过或失败均立即失效，防止暴力枚举
 * - 安全存储：SecretId/SecretKey 仅读取于后端 .env，绝不返回给前端
 * - 双模式：
 *   - 真实模式（配置齐全且非 mock）：调用腾讯云真实下发
 *   - 模拟模式（SMS_MOCK=true 或 TemplateId 未配置）：生成验证码并原样返回 devCode，便于联调
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /** key = `${phone}:${scene}`，phone 为归一化后的 11 位号码 */
  private readonly store = new Map<string, CodeEntry>();
  /** key = phone（归一化 11 位），按自然日统计发送次数 */
  private readonly daily = new Map<string, DailyCounter>();

  private readonly ttlMs = parseInt(process.env.SMS_CODE_TTL_MIN || '5', 10) * 60 * 1000;
  private readonly resendMs = parseInt(process.env.SMS_RESEND_INTERVAL_SEC || '60', 10) * 1000;
  private readonly dailyLimit = parseInt(process.env.SMS_DAILY_LIMIT || '10', 10);

  // ============================ 配置读取 ============================
  private getConfig() {
    return {
      secretId: process.env.SMS_SECRET_ID || '',
      secretKey: process.env.SMS_SECRET_KEY || '',
      region: process.env.SMS_REGION || 'ap-guangzhou',
      sdkAppId: process.env.SMS_SDK_APP_ID || '',
      signName: process.env.SMS_SIGN_NAME || '',
      templateId: process.env.SMS_TEMPLATE_ID || '',
    };
  }

  /** 真实发送所需的配置是否齐全 */
  private isRealConfigured(): boolean {
    const c = this.getConfig();
    return !!(c.secretId && c.secretKey && c.sdkAppId && c.signName && c.templateId);
  }

  /**
   * 是否处于模拟模式：
   * - 显式 SMS_MOCK=true 时强制模拟（便于联调）
   * - 未配置 TemplateId 等关键信息时自动降级为模拟（避免生产误发 / 便于模板待审期测试）
   */
  private isMockMode(): boolean {
    if (process.env.SMS_MOCK === 'true') return true;
    return !this.isRealConfigured();
  }

  // ============================ 手机号校验与归一化 ============================
  /**
   * 校验并归一化手机号：
   * - 支持 +86 / 86 前缀（可省略），也支持裸 11 位号码
   * - 归一化为 11 位号码（1[3-9] 开头）
   * - 非法格式抛出 BadRequestException
   */
  private normalizePhone(raw: string): string {
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException('手机号不能为空');
    }
    let p = raw.trim().replace(/\s/g, '');
    // 去掉国家码前缀（+86 / 86）
    p = p.replace(/^\+?86/, '');
    // 仅保留数字
    p = p.replace(/\D/g, '');
    if (!/^1[3-9]\d{9}$/.test(p)) {
      throw new BadRequestException('手机号格式不正确，请输入有效的 11 位手机号');
    }
    return p;
  }

  private todayStr(): string {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  /** 清理过期验证码，避免内存无限增长 */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expireAt) {
        this.store.delete(key);
      }
    }
  }

  private generateCode(): string {
    // 6 位数字验证码
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ============================ 发送验证码 ============================
  /**
   * 发送验证码到指定手机号
   * @param phoneRaw 原始手机号（可带 +86 前缀）
   * @param scene 业务场景：login / register / reset_password / bind_phone
   * @param clientIp 调用方 IP（用于日志与可选风控）
   * @returns 发送结果；模拟模式下附带 devCode 便于联调（生产真实模式不返回）
   */
  async sendCode(
    phoneRaw: string,
    scene = 'login',
    clientIp?: string,
  ): Promise<{ sent: boolean; devCode?: string; message: string }> {
    const phone = this.normalizePhone(phoneRaw);
    const key = `${phone}:${scene}`;
    const now = Date.now();

    this.cleanupExpired();

    // 1) 防刷：60 秒内不可重复发送同一手机号+场景
    const existing = this.store.get(key);
    if (existing && now < existing.resendAvailableAt) {
      const waitSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
      throw new BadRequestException(`发送过于频繁，请 ${waitSec} 秒后再试`);
    }

    // 2) 每日上限
    const today = this.todayStr();
    const counter = this.daily.get(phone);
    if (counter && counter.date === today && counter.count >= this.dailyLimit) {
      throw new BadRequestException('今日验证码发送次数已达上限，请明日再试');
    }

    // 3) 生成并存储验证码
    const code = this.generateCode();
    this.store.set(key, {
      code,
      expireAt: now + this.ttlMs,
      resendAvailableAt: now + this.resendMs,
      scene,
    });

    // 4) 更新每日计数
    if (counter && counter.date === today) {
      counter.count += 1;
    } else {
      this.daily.set(phone, { date: today, count: 1 });
    }

    this.logger.log(`生成验证码 phone=${phone} scene=${scene} mock=${this.isMockMode()} ip=${clientIp || 'unknown'}`);

    // 5) 模拟模式：不真正发送，返回 devCode
    if (this.isMockMode()) {
      this.logger.warn(`[MOCK] 验证码(phone=${phone}, scene=${scene}): ${code}`);
      return { sent: true, devCode: code, message: '验证码已发送（模拟模式）' };
    }

    // 6) 真实模式：调用腾讯云下发
    try {
      await this.sendViaTencentCloud(phone, code);
    } catch (err) {
      // 发送失败回滚本次占用（计数与存储），避免白白消耗额度/时间窗口
      this.store.delete(key);
      const c = this.daily.get(phone);
      if (c && c.date === today) {
        c.count = Math.max(0, c.count - 1);
      }
      throw err;
    }

    return { sent: true, message: '验证码已发送，请注意查收短信' };
  }

  // ============================ 校验验证码 ============================
  /**
   * 校验验证码（一次性）：无论成功或失败均立即失效，防止暴力枚举
   * @returns true=校验通过；false=验证码错误 / 已过期 / 已使用 / 不存在
   */
  verify(phoneRaw: string, code: string, scene = 'login'): boolean {
    const phone = this.normalizePhone(phoneRaw);
    const key = `${phone}:${scene}`;
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }
    // 过期
    if (Date.now() > entry.expireAt) {
      this.store.delete(key);
      return false;
    }
    // 一次性：先删除再比对，防止重放/暴力枚举
    this.store.delete(key);
    return entry.code === code;
  }

  // ============================ 腾讯云下发 ============================
  /**
   * 通过腾讯云 SMS SDK 发送验证码
   * 模板参数顺序需与腾讯云后台模板一致：
   *   本模板：{1}为您的登录验证码，请于{2}分钟内填写 → [验证码, 有效分钟数]
   */
  private async sendViaTencentCloud(phone: string, code: string): Promise<void> {
    const cfg = this.getConfig();

    // 动态引入，避免在 SDK 未安装时启动失败
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: cfg.secretId,
        secretKey: cfg.secretKey,
      },
      region: cfg.region,
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
          reqTimeout: 10,
        },
      },
    });

    const minutes = String(Math.floor(this.ttlMs / 60000));
    const params = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: cfg.sdkAppId,
      SignName: cfg.signName,
      TemplateId: cfg.templateId,
      // 模板占位符：{1}=验证码，{2}=有效分钟数
      TemplateParamSet: [code, minutes],
    };

    try {
      const resp: any = await client.SendSms(params);
      const status = resp?.SendStatusSet?.[0];
      if (status?.Code !== 'Ok') {
        this.logger.error(`腾讯云 SMS 发送失败：${status?.Code} - ${status?.Message}`);
        throw new BadRequestException(`短信发送失败：${status?.Message || '未知错误'}`);
      }
      this.logger.log(`腾讯云 SMS 发送成功 phone=+86${phone} scene 已处理`);
    } catch (err: any) {
      // SDK 抛出的业务异常直接透传
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`腾讯云 SMS 调用异常：${err?.message || err}`);
      throw new BadRequestException('短信发送失败，请稍后重试');
    }
  }
}
