const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2] || '123456';
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.updateMany(
    { where: { role: 'admin' }, data: { password: hashed } }
  );
  console.log('Admin password reset to:', password);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
