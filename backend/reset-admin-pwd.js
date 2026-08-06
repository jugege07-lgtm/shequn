const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const u = await prisma.user.findFirst({ where: { nickname: 'admin', role: 'admin' } });
    if (u) {
      console.log('Found admin id:', u.id);
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.update({ where: { id: u.id }, data: { password: hash } });
      console.log('Password reset to admin123');
    } else {
      console.log('No admin user found');
    }
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
