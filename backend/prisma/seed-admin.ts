import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 管理员头像种子脚本（幂等）
 * 将默认管理员（nickname=ADMIN_USERNAME 或 role 含 admin）的 avatarUrl
 * 设置为站点 Logo 图片路径，使：
 * - 移动端首页「最新商机」列表中，admin 发布的商机显示 Logo 头像
 * - 后台管理端用户信息展示 Logo 头像
 * 可重复执行；仅当头像为空或非 Logo 时更新。
 */
const LOGO_AVATAR = '/uploads/logo.jpg';

async function main() {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

  const admins = await prisma.user.findMany({
    where: {
      OR: [{ nickname: ADMIN_USERNAME }, { role: { contains: 'admin' } }],
    },
  });

  if (admins.length === 0) {
    console.log('  ✗ 未找到管理员用户，跳过（管理员首登时自动创建）');
    return;
  }

  let updated = 0;
  for (const admin of admins) {
    if (admin.avatarUrl !== LOGO_AVATAR) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { avatarUrl: LOGO_AVATAR },
      });
      console.log(`  ✓ 更新管理员头像: ${admin.nickname || admin.id} → ${LOGO_AVATAR}`);
      updated++;
    } else {
      console.log(`  - 头像已为 Logo，跳过: ${admin.nickname || admin.id}`);
    }
  }

  console.log(`\n本次更新 ${updated} 个管理员头像。`);
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });