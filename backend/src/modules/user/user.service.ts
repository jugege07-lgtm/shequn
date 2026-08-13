import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcryptjs';
import { SmsService } from '../sms/sms.service';

const PHONE_ENCRYPT_KEY = process.env.PHONE_ENCRYPT_KEY || 'community-card-phone-encrypt-key-2026';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  /** AES 加密手机号 */
  encryptPhone(phone: string): string {
    return CryptoJS.AES.encrypt(phone, PHONE_ENCRYPT_KEY).toString();
  }

  /** AES 解密手机号 */
  decryptPhone(input: string): string {
    if (!input) return '';
    // 仅在确为 AES 加密串（OpenSSL 加盐前缀 U2FsdGVkX1）时解密；
    // 历史明文手机号（纯数字）直接原样返回，避免把明文当密文解出乱码。
    if (!input.startsWith('U2FsdGVkX1')) return input;
    try {
      const bytes = CryptoJS.AES.decrypt(input, PHONE_ENCRYPT_KEY);
      const out = bytes.toString(CryptoJS.enc.Utf8);
      return out || input;
    } catch {
      return input;
    }
  }

  /** 根据 openid 查找用户 */
  async findByOpenid(openid: string) {
    return this.prisma.user.findUnique({ where: { openid } });
  }

  /** 根据 ID 查找用户 */
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { card: true },
    });
  }

  /** 根据 openid 创建或更新用户 */
  async createOrUpdate(openid: string, data: {
    nickname?: string;
    avatarUrl?: string;
    unionId?: string;
    phone?: string;
    role?: string;
    adminLevel?: number;
    password?: string;
  }) {
    return this.prisma.user.upsert({
      where: { openid },
      update: {
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
        unionId: data.unionId,
        phone: data.phone ? this.encryptPhone(data.phone) : undefined,
        role: data.role,
        adminLevel: data.adminLevel,
        lastLoginAt: new Date(),
      },
      create: {
        openid,
        nickname: data.nickname || '',
        avatarUrl: data.avatarUrl || '',
        unionId: data.unionId,
        phone: data.phone ? this.encryptPhone(data.phone) : null,
        role: data.role || 'user',
        adminLevel: data.adminLevel || 0,
        lastLoginAt: new Date(),
      },
    });
  }

  /** 获取用户活动报名数量 */
  async getActivityCount(userId: number) {
    return this.prisma.activitySignup.count({ where: { userId } });
  }

  /** 获取用户发布商机数量 */
  async getBusinessCount(userId: number) {
    return this.prisma.business.count({ where: { publisherId: userId } });
  }

  /** 获取用户优惠券数量 */
  async getCouponCount(userId: number) {
    return this.prisma.userCoupon.count({ where: { userId } });
  }

  /** 更新用户资料 */
  async updateProfile(userId: number, data: {
    nickname?: string;
    avatarUrl?: string;
    phone?: string;
    gender?: number;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        phone: data.phone ? this.encryptPhone(data.phone) : undefined,
        lastLoginAt: new Date(),
      },
    });
  }

  // ========== 支付密码 ==========

  /** 查询用户是否已设置支付密码 */
  async hasPayPassword(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { payPassword: true, phone: true },
    });
    return !!user?.payPassword;
  }

  /** 获取用户已解密的手机号（用于发送验证码），兼容明文/加密两种存储 */
  async getDecryptedPhone(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    const stored = user?.phone;
    if (!stored) throw new BadRequestException('请先绑定手机号');
    // 数据库中既有明文存储（register），也有加密存储（createOrUpdate）
    const plain = /^1[3-9]\d{9}$/.test(stored) ? stored : this.decryptPhone(stored);
    if (!/^1[3-9]\d{9}$/.test(plain)) throw new BadRequestException('手机号异常，无法验证');
    return plain;
  }

  /**
   * 设置支付密码（首次设置无需验证码；修改需短信验证码）
   * @param isFirst 是否为首次设置
   */
  async setPayPassword(userId: number, payPassword: string, isFirst: boolean, code?: string) {
    if (!payPassword || payPassword.length < 6 || payPassword.length > 20) {
      throw new BadRequestException('支付密码需为6-20位');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { payPassword: true, phone: true },
    });

    if (isFirst) {
      // 首次设置：仅当尚未设置时允许
      if (user?.payPassword) {
        throw new BadRequestException('已设置过支付密码，请使用修改功能');
      }
    } else {
      // 修改：必须已设置 + 短信验证码校验
      if (!user?.payPassword) {
        throw new BadRequestException('尚未设置支付密码');
      }
      if (!code) throw new BadRequestException('请输入短信验证码');
      const stored = user?.phone || '';
      const phone = /^1[3-9]\d{9}$/.test(stored) ? stored : this.decryptPhone(stored);
      if (!/^1[3-9]\d{9}$/.test(phone)) throw new BadRequestException('手机号异常，无法验证');
      if (!this.smsService.verify(phone, code)) {
        throw new BadRequestException('验证码错误或已过期');
      }
    }

    const hashed = await bcrypt.hash(payPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { payPassword: hashed },
    });
    return { success: true };
  }

  /** 校验支付密码（余额支付时调用） */
  async verifyPayPassword(userId: number, payPassword: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { payPassword: true },
    });
    if (!user?.payPassword) return false;
    return bcrypt.compare(payPassword, user.payPassword);
  }

  /** 发送修改支付密码的验证码（发送到用户绑定手机号） */
  async sendPayPasswordCode(userId: number) {
    const phone = await this.getDecryptedPhone(userId);
    const result = await this.smsService.sendCode(phone);
    return {
      success: true,
      message: '验证码已发送',
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      devCode: result.devCode,
    };
  }
}
