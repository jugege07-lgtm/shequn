import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as CryptoJS from 'crypto-js';

const PHONE_ENCRYPT_KEY = process.env.PHONE_ENCRYPT_KEY || 'community-card-phone-encrypt-key-2026';
// 固定 IV，保证相同明文加密结果一致，便于数据库按手机号精确查询
const PHONE_IV = CryptoJS.enc.Utf8.parse('0102030405060708');
// 密钥补齐到 32 字节（AES-256）
const PHONE_KEY = CryptoJS.enc.Utf8.parse(PHONE_ENCRYPT_KEY.padEnd(32, '0').slice(0, 32));

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /** AES 加密手机号（确定性加密，相同明文产生相同密文） */
  encryptPhone(phone: string): string {
    const encrypted = CryptoJS.AES.encrypt(phone, PHONE_KEY, {
      iv: PHONE_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }

  /** AES 解密手机号 */
  decryptPhone(encrypted: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, PHONE_KEY, {
        iv: PHONE_IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return '';
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
}
