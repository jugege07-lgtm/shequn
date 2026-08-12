/**
 * H5 测试数据清理脚本
 * ============================================================
 * 作用：清理 2026-08-12 H5 测试产生的测试数据（测试商机、测试订单等）。
 *
 * 运行方式（在服务器 /home/ubuntu/shequn/backend 下执行）：
 *   # 1) 先预览将删除什么（不实际删除）
 *   npx ts-node prisma/cleanup-test-data.ts --dry-run
 *
 *   # 2) 确认无误后真正删除
 *   npx ts-node prisma/cleanup-test-data.ts --yes
 *
 * 需要 .env 中的 DATABASE_URL / PHONE_ENCRYPT_KEY 正确。
 * 通过 Prisma 事务删除，自动处理外键依赖顺序，避免报错或残留。
 * ============================================================
 */
import { PrismaClient } from '@prisma/client';
import * as CryptoJS from 'crypto-js';

const prisma = new PrismaClient();
const PHONE_KEY = process.env.PHONE_ENCRYPT_KEY || 'community-card-phone-encrypt-key-2026';

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--yes');
const TEST_PHONE = '13525538517'; // 测试账号
const TEST_TITLE_KEYWORDS = ['测试', 'TEST', 'test']; // 测试商机标题关键词

function decryptPhone(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, PHONE_KEY);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    return /^1[3-9]\d{9}$/.test(plain) ? plain : encrypted;
  } catch {
    return encrypted;
  }
}

async function findTestUser() {
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    select: { id: true, nickname: true },
  });
  const matches: number[] = [];
  for (const u of users) {
    const row: any = await prisma.$queryRawUnsafe(
      'SELECT phone FROM users WHERE id = ?',
      u.id,
    );
    const phone = row?.[0]?.phone as string | undefined;
    if (phone && decryptPhone(phone) === TEST_PHONE) {
      matches.push(u.id);
    }
  }
  return matches;
}

async function findTestBusinesses() {
  const all = await prisma.business.findMany({
    where: { title: { contains: TEST_TITLE_KEYWORDS[0] } },
    select: { id: true, title: true, publisherId: true },
  });
  return all;
}

async function dryRun() {
  const users = await findTestUser();
  console.log('=== 测试账号(手机号已解密匹配) ===');
  console.log(users.length ? `用户ID: ${users.join(', ')}` : '未找到测试账号，跳过');

  const biz = await findTestBusinesses();
  console.log('=== 测试商机(标题含"测试") ===');
  biz.forEach((b) => console.log(`  商机ID=${b.id} 标题=${b.title} 发布人=${b.publisherId}`));
  if (!biz.length) console.log('  未找到测试商机');

  // 统计这些商机关联的订单
  const bizIds = biz.map((b) => b.id);
  if (bizIds.length) {
    const orders = await prisma.order.findMany({
      where: { businessId: { in: bizIds } },
      select: { id: true, orderNo: true, userId: true },
    });
    console.log(`=== 测试商机关联订单 ${orders.length} 条 ===`);
    orders.forEach((o) => console.log(`  订单ID=${o.id} 单号=${o.orderNo} 用户=${o.userId}`));
  }

  // 测试账号的订单（非商机关联的一般订单）
  for (const uid of users) {
    const orders = await prisma.order.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderNo: true, orderType: true, status: true, createdAt: true },
    });
    console.log(`=== 测试账号 ${uid} 的全部订单 ${orders.length} 条 ===`);
    orders.forEach((o) =>
      console.log(`  订单ID=${o.id} 单号=${o.orderNo} 类型=${o.orderType} 状态=${o.status}`),
    );
  }
}

async function wipe() {
  const users = await findTestUser();
  const biz = await findTestBusinesses();
  const bizIds = biz.map((b) => b.id);

  // 收集要删除的订单：测试商机关联订单 + 测试账号订单
  const orderWhere: any[] = [];
  if (bizIds.length) orderWhere.push({ businessId: { in: bizIds } });
  if (users.length) orderWhere.push({ userId: { in: users } });
  const targetOrders = orderWhere.length
    ? await prisma.order.findMany({ where: { OR: orderWhere }, select: { id: true, orderNo: true } })
    : [];
  const orderIds = targetOrders.map((o) => o.id);
  const orderNos = targetOrders.map((o) => o.orderNo);

  const summary: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    // 1. 优惠券核销引用（orderNo）
    if (orderNos.length) {
      const r = await tx.userCoupon.updateMany({
        where: { orderNo: { in: orderNos } },
        data: { status: 'expired', orderNo: null, usedAt: null },
      });
      summary['userCoupon(orderNo)回滚'] = r.count;
    }

    // 2. 活动报名(orderNo) / 商机解锁(orderNo)
    if (orderNos.length) {
      const s = await tx.activitySignup.deleteMany({ where: { orderNo: { in: orderNos } } });
      summary['activitySignup'] = s.count;
      const u = await tx.businessUnlock.deleteMany({ where: { orderNo: { in: orderNos } } });
      summary['businessUnlock'] = u.count;
    }

    // 3. 退款单
    if (orderIds.length) {
      const r = await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } });
      summary['refund'] = r.count;
    }

    // 4. 订单明细（order_items 级联，但显式删除更稳）
    if (orderIds.length) {
      const items = await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      summary['orderItem'] = items.count;
    }

    // 5. 订单本身
    if (orderIds.length) {
      const o = await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      summary['order'] = o.count;
    }

    // 6. 商机关联：解锁记录 / 余额分成记录 / 商机订单(已删) → 商机
    for (const b of biz) {
      const u = await tx.businessUnlock.deleteMany({ where: { businessId: b.id } });
      summary[`businessUnlock(biz${b.id})`] = (summary[`businessUnlock(biz${b.id})`] || 0) + u.count;
      const bl = await tx.balanceLog.deleteMany({ where: { businessId: b.id } });
      summary[`balanceLog(biz${b.id})`] = (summary[`balanceLog(biz${b.id})`] || 0) + bl.count;
    }
    if (bizIds.length) {
      const b = await tx.business.deleteMany({ where: { id: { in: bizIds } } });
      summary['business(测试商机)'] = b.count;
    }

    // 7. 测试账号的其他独立数据（若判定账号为纯测试账号）
    for (const uid of users) {
      for (const [name, run] of [
        ['activityFavorite', () => tx.activityFavorite.deleteMany({ where: { userId: uid } })],
        ['cartItem', () => tx.cartItem.deleteMany({ where: { userId: uid } })],
        ['pointLog', () => tx.pointLog.deleteMany({ where: { userId: uid } })],
        ['balanceLog', () => tx.balanceLog.deleteMany({ where: { userId: uid } })],
        ['message', () => tx.message.deleteMany({ where: { userId: uid } })],
        ['userCoupon(用户所有)', () => tx.userCoupon.deleteMany({ where: { userId: uid } })],
        ['userAddress', () => tx.userAddress.deleteMany({ where: { userId: uid } })],
        ['connection(请求方)', () => tx.connection.deleteMany({ where: { requesterId: uid } })],
        ['connection(接收方)', () => tx.connection.deleteMany({ where: { targetId: uid } })],
        ['userCard', () => tx.userCard.deleteMany({ where: { userId: uid } })],
        ['vipSubscription', () => tx.vipSubscription.deleteMany({ where: { userId: uid } })],
      ] as const) {
        const r: any = await run();
        summary[`用户${uid} ${name}`] = r.count;
      }
    }
  });

  console.log('=== 清理完成 汇总 ===');
  Object.entries(summary).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('注意：测试账号(users)记录本身未删除，如需删除请手动确认。');
}

(async () => {
  try {
    if (DRY_RUN) {
      console.log('>>> 预览模式（未删除任何数据），确认后加 --yes 执行\n');
      await dryRun();
    } else {
      console.log('>>> 执行删除模式\n');
      await wipe();
    }
  } catch (e) {
    console.error('执行出错：', (e as Error).message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();