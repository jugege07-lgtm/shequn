import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as CryptoJS from 'crypto-js';

const PHONE_ENCRYPT_KEY = process.env.PHONE_ENCRYPT_KEY || 'community-card-phone-encrypt-key-2026';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /** AES 加密手机号 */
  encryptPhone(phone: string): string {
    return CryptoJS.AES.encrypt(phone, PHONE_ENCRYPT_KEY).toString();
  }

  /** AES 解密手机号 */
  decryptPhone(encrypted: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, PHONE_ENCRYPT_KEY);
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
