import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const password = process.argv[2] || '123456'
const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash(password, 10)
  // 重置所有管理员账号为同一密码，避免历史占位密码导致无法登录
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    orderBy: { id: 'asc' },
  })
  if (admins.length === 0) {
    const user = await prisma.user.create({
      data: {
        openid: 'admin_fixed',
        nickname: 'admin',
        avatarUrl: '',
        role: 'admin',
        adminLevel: 1,
        password: hashed,
      },
    })
    console.log('已创建管理员账号:', user.nickname, `(${user.id})`)
  } else {
    for (const admin of admins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashed },
      })
      console.log('管理员密码已重置:', admin.nickname, `(${admin.id})`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
