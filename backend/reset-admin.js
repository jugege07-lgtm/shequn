require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  
  // 查找或创建管理员
  let user = await prisma.user.findFirst({ 
    where: { nickname: 'admin', role: 'admin' } 
  });
  
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });
    console.log('✅ Admin password updated to: admin123');
  } else {
    user = await prisma.user.create({
      data: {
        openid: 'admin_fixed_seed',
        nickname: 'admin',
        avatarUrl: '',
        role: 'admin',
        adminLevel: 1,
        password: hashed,
        vipLevel: 0
      }
    });
    console.log('✅ Admin created with id:', user.id);
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
