import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const list = await prisma.pointRule.findMany({ take: 5 })
    console.log('success', list)
  } catch (e) {
    console.error('error', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
