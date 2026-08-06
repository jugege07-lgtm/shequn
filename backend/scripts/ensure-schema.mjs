import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function columnExists(table, column) {
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info(${table})`)
  return cols.some((c) => c.name === column)
}

async function indexExists(indexName) {
  const indexes = await prisma.$queryRawUnsafe(`PRAGMA index_list('business_categories')`)
  return indexes.some((i) => i.name === indexName)
}

async function main() {
  // business_categories
  if (!(await columnExists('business_categories', 'code'))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "business_categories" ADD COLUMN "code" TEXT`)
    console.log('Added business_categories.code')
  }
  await prisma.$executeRawUnsafe(`UPDATE "business_categories" SET "code" = 'cat_' || id WHERE "code" IS NULL OR "code" = ''`)
  if (!(await indexExists('business_categories_code_key'))) {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "business_categories_code_key" ON "business_categories"("code")`)
    console.log('Created unique index on business_categories.code')
  }

  // point_rules
  if (!(await columnExists('point_rules', 'rule_group'))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "point_rules" ADD COLUMN "rule_group" TEXT NOT NULL DEFAULT 'default'`)
    console.log('Added point_rules.rule_group')
  }
  if (!(await columnExists('point_rules', 'priority'))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "point_rules" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0`)
    console.log('Added point_rules.priority')
  }

  console.log('Schema check complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
