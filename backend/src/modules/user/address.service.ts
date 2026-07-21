import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async getAddresses(userId: number) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: number, data: {
    receiver: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
    isDefault?: number;
  }) {
    if (data.isDefault === 1) {
      await this.clearDefault(userId);
    }
    return this.prisma.userAddress.create({
      data: { ...data, userId },
    });
  }

  async updateAddress(userId: number, id: number, data: {
    receiver?: string;
    phone?: string;
    province?: string;
    city?: string;
    district?: string;
    detail?: string;
    isDefault?: number;
  }) {
    const address = await this.prisma.userAddress.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('地址不存在');
    if (data.isDefault === 1) {
      await this.clearDefault(userId);
    }
    return this.prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  async deleteAddress(userId: number, id: number) {
    const address = await this.prisma.userAddress.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('地址不存在');
    return this.prisma.userAddress.delete({ where: { id } });
  }

  async setDefault(userId: number, id: number) {
    const address = await this.prisma.userAddress.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('地址不存在');
    await this.clearDefault(userId);
    return this.prisma.userAddress.update({
      where: { id },
      data: { isDefault: 1 },
    });
  }

  private async clearDefault(userId: number) {
    await this.prisma.userAddress.updateMany({
      where: { userId, isDefault: 1 },
      data: { isDefault: 0 },
    });
  }
}
