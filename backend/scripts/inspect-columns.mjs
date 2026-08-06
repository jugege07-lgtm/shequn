import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ruleCols = await prisma.$queryRawUnsafe(`PRAGMA table_info(point_rules)`)
  console.log('point_rules columns:', ruleCols)
  const catCols = await prisma.$queryRawUnsafe(`PRAGMA table_info(business_categories)`)
  console.log('business_categories columns:', catCols)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
