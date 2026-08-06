import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async getMessages(userId: number, params?: { page?: number; size?: number }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;

    const where = { userId };
    const [list, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async markRead(messageId: number, userId: number) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, userId },
    });
    if (!message) {
      throw new Error('消息不存在');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: 1, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.message.count({
      where: { userId, isRead: 0 },
    });
    return { count };
  }
}
