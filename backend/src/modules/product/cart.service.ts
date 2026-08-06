import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToCart(userId: number, productId: number, quantity = 1, specs?: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 1) {
      throw new BadRequestException('商品不存在或已下架');
    }
    if (quantity < 1) {
      throw new BadRequestException('数量不能小于1');
    }

    const specKey = specs ? JSON.stringify(specs) : '{}';
    const existing = await this.prisma.cartItem.findFirst({
      where: { userId, productId, specs: specKey },
    });

    const finalQty = existing ? existing.quantity + quantity : quantity;
    if (product.stock < finalQty) {
      throw new BadRequestException('商品库存不足');
    }

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: finalQty },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
        specs: specKey,
      },
      include: { product: true },
    });
  }

  async updateQuantity(userId: number, cartItemId: number, quantity: number) {
    if (quantity < 1) {
      return this.remove(userId, cartItemId);
    }
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('购物车商品不存在');
    if (item.product.stock < quantity) {
      throw new BadRequestException('商品库存不足');
    }
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async remove(userId: number, cartItemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });
    if (!item) throw new NotFoundException('购物车商品不存在');
    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clear(userId: number) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
