import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async getPublicCategories() {
    return this.prisma.productCategory.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPublicProducts(params?: { page?: number; size?: number; category?: string }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    const category = params?.category;
    const where: any = { status: 1 };
    if (category) {
      const categoryId = Number(category);
      if (!isNaN(categoryId)) {
        where.categoryId = categoryId;
      } else {
        where.category = { name: category };
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getProduct(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async getMyOrders(userId: number, params?: { page?: number; size?: number; status?: string }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    const status = params?.status;
    const where: any = { userId };
    if (status) where.status = status;
    
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async createOrder(dto: any, userId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== 1) {
      throw new BadRequestException('商品不存在或已下架');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException('商品库存不足');
    }

    const payAmount = product.price * dto.quantity;
    const orderNo = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'product',
          totalAmount: payAmount,
          discountAmount: 0,
          payAmount,
          status: 'pending_payment',
          addressId: dto.addressId || null,
          remark: dto.remark || '',
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productImage: product.coverImage,
          price: product.price,
          quantity: dto.quantity,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: dto.quantity }, salesCount: { increment: dto.quantity } },
      });

      return this.findOrderById(order.id, tx);
    });
  }

  async createOrderFromCart(dto: { cartItemIds: number[]; addressId?: number; remark?: string }, userId: number) {
    const { cartItemIds } = dto;
    if (!cartItemIds || cartItemIds.length === 0) {
      throw new BadRequestException('请选择要结算的商品');
    }

    const cartItems = await this.prisma.cartItem.findMany({
      where: { id: { in: cartItemIds }, userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('购物车商品不存在');
    }

    for (const item of cartItems) {
      if (!item.product || item.product.status !== 1) {
        throw new BadRequestException(`商品 ${item.product?.name || ''} 已下架`);
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`商品 ${item.product.name} 库存不足`);
      }
    }

    const payAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const orderNo = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'product',
          totalAmount: payAmount,
          discountAmount: 0,
          payAmount,
          status: 'pending_payment',
          addressId: dto.addressId || null,
          remark: dto.remark || '',
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.coverImage,
            price: item.product.price,
            quantity: item.quantity,
          },
        });
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { id: { in: cartItemIds }, userId } });

      return this.findOrderById(order.id, tx);
    });
  }

  private async findOrderById(id: number, tx?: any) {
    const client = tx || this.prisma;
    return client.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }

  async getOrder(userId: number, id: number) {
    const order = await this.findOrderById(id);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  async payOrder(userId: number, id: number) {
    const order = await this.getOrder(userId, id);
    if (order.status !== 'pending_payment') {
      throw new BadRequestException('订单状态异常');
    }
    await this.paymentService.markOrderPaid(order.orderNo);
    return this.findOrderById(id);
  }

  async completeOrder(userId: number, id: number) {
    const order = await this.getOrder(userId, id);
    if (order.status !== 'shipped') {
      throw new BadRequestException('订单状态异常');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: { items: { include: { product: true } } },
    });
  }
}
