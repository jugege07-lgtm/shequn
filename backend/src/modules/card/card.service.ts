import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
// 必须 namespace import：qrcode 是纯 CommonJS 包（无 default 导出），
// 且 tsconfig 未开 esModuleInterop，default import 编译后取到 undefined → 运行时 500
import * as QRCode from 'qrcode';
import { UserService } from '../user/user.service';

@Injectable()
export class CardService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  /** 公开名片详情（无需登录） */
  async getPublicCard(cardId: number) {
    const card = await this.prisma.userCard.findUnique({
      where: { id: cardId },
      include: { user: true },
    });
    if (!card) throw new NotFoundException('名片不存在');

    await this.prisma.userCard.update({
      where: { id: cardId },
      data: { viewCount: { increment: 1 } },
    });

    return this.sanitizeCard(card);
  }

  /** 获取我的名片（包含解密后的手机号，用于"我的名片"展示） */
  async getMyCard(userId: number) {
    const card = await this.prisma.userCard.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!card) {
      return await this.createUserCard(userId, {});
    }
    // 解密用户手机号并附加到名片对象上，保证注册信息同步至"我的名片"
    const decryptedPhone = card.user?.phone
      ? this.userService.decryptPhone(card.user.phone)
      : '';
    return {
      ...card,
      phone: decryptedPhone,
    };
  }

  /** 创建/更新名片 */
  async updateCard(userId: number, data: {
    realName?: string;
    company?: string;
    position?: string;
    wechat?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    bgImageUrl?: string;
    intro?: string;
    tags?: any[] | string;
    socialLinks?: any[] | string;
  }) {
    // 手机号属于用户表字段，需单独提取并加密，避免写入 UserCard 不存在的 phone 列
    const { phone, ...cardData } = data;

    const upsertData: any = {
      ...cardData,
      userId: Number(userId),
      tags: cardData.tags
        ? (Array.isArray(cardData.tags) ? JSON.stringify(cardData.tags) : cardData.tags)
        : undefined,
      socialLinks: cardData.socialLinks
        ? (Array.isArray(cardData.socialLinks) ? JSON.stringify(cardData.socialLinks) : cardData.socialLinks)
        : undefined,
    };

    const card = await this.prisma.userCard.upsert({
      where: { userId: Number(userId) },
      update: upsertData,
      // avatarUrl 非空列：新建名片时未传头像必须兜底空串，否则 Prisma 校验 500
      create: { ...upsertData, avatarUrl: upsertData.avatarUrl || '' },
    });

    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: {
        avatarUrl: data.avatarUrl || undefined,
        nickname: data.realName || undefined,
        phone: phone ? this.userService.encryptPhone(phone) : undefined,
      },
    });

    return card;
  }

  /** 生成名片二维码 Base64 PNG（浏览器端优先，此方法作为后端兜底） */
  async getQrcodeBase64(cardId: number): Promise<string> {
    // 生产 H5 地址（二维码内容绝不能写死 localhost，真机扫码打不开）
    const shareUrl = `https://www.jugekeji.com/h5/card/share/${cardId}`;
    try {
      // 尝试使用 toDataURL（需要 canvas 模块）
      return await QRCode.toDataURL(shareUrl, { width: 300, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } });
    } catch {
      // canvas 未安装时降级为 SVG data URL（无需任何原生依赖）
      const svg = await QRCode.toString(shareUrl, { type: 'svg', width: 300, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } });
      return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }
  }

  /** 生成名片分享图片（HTML canvas 方式） */
  async getShareCard(cardId: number): Promise<string> {
    const shareUrl = `https://www.jugekeji.com/h5/card/share/${cardId}`;
    try {
      return await QRCode.toDataURL(shareUrl, { width: 280, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } });
    } catch {
      const svg = await QRCode.toString(shareUrl, { type: 'svg', width: 280, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } });
      return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }
  }

  /** 脱敏处理 */
  private sanitizeCard(card: any) {
    if (card.user) {
      card.user = {
        ...card.user,
        phone: card.user.phone ? '***' : '',
      };
    }
    
    const { phone, wechat, ...rest } = card;
    return {
      ...rest,
      wechat: wechat ? `****${wechat.slice(-4)}` : '',
      phone: phone ? '***' : '',
    };
  }

  private async createUserCard(userId: number, data: any) {
    return this.prisma.userCard.create({
      data: {
        userId: Number(userId),
        realName: '',
        avatarUrl: '',
        ...data,
      },
    });
  }
}
