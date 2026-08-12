import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { PointService } from '../point/point.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private pointService: PointService,
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

  /**
   * 计算积分购买明细
   * @returns { pointsUsed, cashDeduct, payAmount, payType }
   *  - 纯积分:  payAmount = 0, cashDeduct = 订单全额
   *  - 积分+现金: pointsUsed / cashDeduct 由服务端权威计算,payAmount 为剩余现金
   */
  private computePointsPlan(
    product: any,
    quantity: number,
    payType: string,
    requestedPoints?: number,
  ) {
    const totalAmount = product.price * quantity;
    const enabled = Number(product.pointsEnabled) || 0;

    if (payType === 'points') {
      // 纯积分兑换
      if (enabled !== 1) {
        throw new BadRequestException('该商品不支持纯积分兑换');
      }
      const required = Math.floor(Number(product.pointsPrice) || 0) * quantity;
      if (required <= 0) {
        throw new BadRequestException('未配置兑换所需积分');
      }
      // 积分兑换上下限（可选）
      const maxLimit = Number(product.pointsMaxLimit) || 0;
      if (maxLimit > 0 && required > maxLimit) {
        throw new BadRequestException(`单笔最多使用 ${maxLimit} 积分`);
      }
      return {
        payType: 'points',
        pointsUsed: required,
        cashDeduct: totalAmount,
        payAmount: 0,
        totalAmount,
      };
    }

    if (payType === 'points_cash') {
      // 积分 + 现金组合支付
      if (enabled !== 2) {
        throw new BadRequestException('该商品不支持积分+现金组合支付');
      }
      const rate = Number(product.pointsRate) || 100; // N 积分 = 1 元
      if (rate <= 0) throw new BadRequestException('积分汇率配置错误');

      // 计算积分可抵扣的现金上限
      let maxCash = totalAmount;
      if (product.pointsDeductMode === 'ratio') {
        const pct = Number(product.pointsRatioPercent) || 0;
        if (pct <= 0 || pct > 100) {
          throw new BadRequestException('比例抵扣百分比配置错误（0-100）');
        }
        maxCash = Math.min(maxCash, (totalAmount * pct) / 100);
      }
      const maxDeduct = Number(product.pointsMaxDeduct) || 0;
      if (maxDeduct > 0) maxCash = Math.min(maxCash, maxDeduct);

      // 组合支付至少要留 0.01 元现金
      maxCash = Math.min(maxCash, Math.max(0, totalAmount - 0.01));

      // 用户想使用的积分（不传则默认用满）
      let want = Number(requestedPoints) || 0;
      if (want <= 0) want = Math.ceil(maxCash * rate);

      const minLimit = Number(product.pointsMinLimit) || 0;
      if (want < minLimit) {
        throw new BadRequestException(`本商品最低使用 ${minLimit} 积分`);
      }
      const maxPointsLimit = Number(product.pointsMaxLimit) || 0;
      if (maxPointsLimit > 0 && want > maxPointsLimit) {
        throw new BadRequestException(`单笔最多使用 ${maxPointsLimit} 积分`);
      }

      // 实际可抵扣现金 = min(积分折算, 上限)
      const rawCash = want / rate;
      const cashDeduct = Math.min(rawCash, maxCash);
      const pointsUsed = Math.ceil(cashDeduct * rate);
      const payAmount = Math.max(0, Math.round((totalAmount - cashDeduct) * 100) / 100);

      return {
        payType: 'points_cash',
        pointsUsed,
        cashDeduct: Math.round(cashDeduct * 100) / 100,
        payAmount,
        totalAmount,
      };
    }

    // 默认：纯现金
    return {
      payType: 'cash',
      pointsUsed: 0,
      cashDeduct: 0,
      payAmount: totalAmount,
      totalAmount,
    };
  }

  /**
   * 计算并核销优惠券抵扣（在创建订单的事务内调用）
   * @param couponId user_coupons 表 id
   * @returns { deduct, userCouponId } deduct 为优惠金额，userCouponId 为需核销的券 id
   */
  private async computeCouponDeduct(
    tx: any,
    userId: number,
    couponId: number,
    totalAmount: number,
  ) {
    const uc = await tx.userCoupon.findFirst({
      where: { id: couponId, userId, status: 'unused' },
      include: { coupon: true },
    });
    if (!uc || !uc.coupon) {
      throw new BadRequestException('优惠券不存在或不可用');
    }
    if (uc.expiresAt && new Date(uc.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('优惠券已过期');
    }
    const coupon = uc.coupon;
    if (coupon.status !== 1) {
      throw new BadRequestException('优惠券已失效');
    }
    if (totalAmount < coupon.minAmount) {
      throw new BadRequestException(`订单满 ¥${coupon.minAmount} 才可使用该优惠券`);
    }

    let deduct = 0;
    if (coupon.type === 'percent') {
      // 折扣为十进制小数，如 9.5 折 ==> value = 0.95，优惠 = 总额 × (1 - value)
      deduct = Math.round(totalAmount * (1 - coupon.value) * 100) / 100;
      if (coupon.discountCap && coupon.discountCap > 0) {
        deduct = Math.min(deduct, coupon.discountCap);
      }
    } else {
      deduct = Math.min(coupon.value, totalAmount);
    }
    deduct = Math.round(deduct * 100) / 100;

    return { deduct, userCouponId: couponId };
  }

  /**
   * 创建订单（支持纯积分 / 积分+现金 / 纯现金 + 优惠券）
   * dto.payType: 'cash' | 'points' | 'points_cash'
   * dto.pointsUsed: 组合支付时用户希望使用的积分（可选，默认用满）
   */
  async createOrder(dto: any, userId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== 1) {
      throw new BadRequestException('商品不存在或已下架');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException('商品库存不足');
    }

    const payType = dto.payType || 'cash';
    const plan = this.computePointsPlan(product, dto.quantity, payType, dto.pointsUsed);

    const orderNo = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.prisma.$transaction(async (tx) => {
      // 库存二次校验 + 扣减（事务内）
      const fresh = await tx.product.findUnique({ where: { id: product.id } });
      if (!fresh || fresh.stock < dto.quantity) {
        throw new BadRequestException('商品库存不足');
      }

      // 组合支付 & 纯积分：校验用户积分余额（组合支付先校验,真正扣减在支付成功后）
      if (plan.pointsUsed > 0) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const balance = user?.points ?? 0;
        if (balance < plan.pointsUsed) {
          throw new BadRequestException(`积分不足，当前 ${balance} 积分，需要 ${plan.pointsUsed} 积分`);
        }
      }

      const isPointsOrder = payType === 'points';

      // 优惠券抵扣（纯积分兑换订单不支持使用优惠券）
      let couponDeduct = 0;
      let userCouponId: number | null = null;
      if (!isPointsOrder && dto.couponId) {
        const coupon = await this.computeCouponDeduct(tx, userId, dto.couponId, plan.totalAmount);
        couponDeduct = coupon.deduct;
        userCouponId = coupon.userCouponId;
      }
      const finalPayAmount = Math.max(0, Math.round((plan.payAmount - couponDeduct) * 100) / 100);

      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'product',
          totalAmount: plan.totalAmount,
          discountAmount: couponDeduct,
          payAmount: finalPayAmount,
          pointsUsed: plan.pointsUsed,
          pointsDeduct: plan.cashDeduct,
          status: isPointsOrder ? 'paid' : 'pending_payment',
          paidAt: isPointsOrder ? new Date() : null,
          addressId: dto.addressId || null,
          remark: dto.remark || '',
        },
      });

      // 核销优惠券
      if (userCouponId) {
        await tx.userCoupon.update({
          where: { id: userCouponId },
          data: { status: 'used', orderNo, usedAt: new Date() },
        });
      }

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

      // 纯积分订单：下单即完成，事务内直接扣积分 + 写明细
      if (isPointsOrder) {
        await this.deductPointsInTx(tx, userId, plan.pointsUsed, 'product_exchange',
          `积分兑换商品「${product.name}」x${dto.quantity}，消耗 ${plan.pointsUsed} 积分`);
      }

      return this.findOrderById(order.id, tx);
    });
  }

  /**
   * 支付成功后扣减积分（组合支付）
   * 供 PaymentService 在订单履约时调用
   */
  async fulfillPointsOrder(orderNo: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order || order.pointsUsed <= 0 || order.status !== 'paid') return;

    const product = await this.prisma.orderItem.findFirst({
      where: { orderId: order.id },
    });

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      if ((user?.points ?? 0) < order.pointsUsed) {
        throw new BadRequestException(
          `积分不足，当前 ${user?.points ?? 0} 积分，需要 ${order.pointsUsed} 积分`,
        );
      }
      await this.deductPointsInTx(tx, order.userId, order.pointsUsed, 'product_exchange',
        `积分+现金购买商品${product ? `「${product.productName}」` : ''}，消耗 ${order.pointsUsed} 积分`);
    });
  }

  private async deductPointsInTx(tx: any, userId: number, points: number, action: string, remark: string) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    const balance = (user?.points ?? 0) - points;
    if (balance < 0) {
      throw new BadRequestException(`积分不足，当前 ${user?.points ?? 0} 积分`);
    }
    await tx.user.update({ where: { id: userId }, data: { points: balance } });
    await tx.pointLog.create({
      data: {
        userId,
        action,
        points: -points,
        balance,
        remark,
      },
    });
  }

  async createOrderFromCart(dto: { cartItemIds: number[]; addressId?: number; remark?: string; couponId?: number }, userId: number) {
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
      // 优惠券抵扣
      let couponDeduct = 0;
      let userCouponId: number | null = null;
      if (dto.couponId) {
        const coupon = await this.computeCouponDeduct(tx, userId, dto.couponId, payAmount);
        couponDeduct = coupon.deduct;
        userCouponId = coupon.userCouponId;
      }
      const finalPayAmount = Math.max(0, Math.round((payAmount - couponDeduct) * 100) / 100);

      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'product',
          totalAmount: payAmount,
          discountAmount: couponDeduct,
          payAmount: finalPayAmount,
          status: 'pending_payment',
          addressId: dto.addressId || null,
          remark: dto.remark || '',
        },
      });

      // 核销优惠券
      if (userCouponId) {
        await tx.userCoupon.update({
          where: { id: userCouponId },
          data: { status: 'used', orderNo, usedAt: new Date() },
        });
      }

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
