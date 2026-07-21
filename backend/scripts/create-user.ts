// 临时脚本：创建/重置一个手机号+密码登录的用户
// 用法：npx ts-node scripts/create-user.ts <phone> <password>
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function main() {
  const phone = process.argv[2] || '18538789081';
  const password = process.argv[3] || '123456';
  const prisma = new PrismaClient();

  try {
    // 先检查手机号是否已存在
    const existing = await prisma.user.findFirst({ where: { phone } });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      // 已存在：更新密码
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword, status: 'normal' },
      });
      console.log(`✅ 用户已存在，密码已重置：id=${updated.id}, phone=${phone}`);
    } else {
      // 不存在：新建用户
      const created = await prisma.user.create({
        data: {
          openid: `local_${phone}`,
          phone,
          nickname: `用户${phone.slice(-4)}`,
          password: hashedPassword,
          role: 'user',
          status: 'normal',
        },
      });
      console.log(`✅ 用户创建成功：id=${created.id}, phone=${phone}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ 创建失败:', e);
  process.exit(1);
});
