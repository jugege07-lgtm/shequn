import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 商品数据种子脚本
 * 创建 4 条不同分类的测试商品记录
 * - 覆盖不同价格带与分类
 * - 状态均为 1（上架），便于商城展示
 */
const categories = [
  { name: '会员权益', parentId: 0 },
  { name: '课程培训', parentId: 0 },
  { name: '商务服务', parentId: 0 },
  { name: '实体商品', parentId: 0 },
];

const products = [
  {
    name: '社群 VIP 会员月卡',
    categoryName: '会员权益',
    price: 19.9,
    vipPrice: 0,
    stock: 999,
    description: '开通社群 VIP 会员，尊享活动优先报名、商机免费解锁、商城专属折扣等多项权益。开通后立即生效，有效期 30 天。',
    coverImage: '/uploads/prod_vip.jpg',
  },
  {
    name: '新媒体运营系统课',
    categoryName: '课程培训',
    price: 199,
    vipPrice: 159,
    stock: 200,
    description: '30 节视频课系统讲解公众号、抖音、小红书运营方法论，含选题策划、内容创作、涨粉变现全流程，附赠模板素材包。',
    coverImage: '/uploads/prod_course.jpg',
  },
  {
    name: '财务代理记账半年服务',
    categoryName: '商务服务',
    price: 1200,
    vipPrice: 1080,
    stock: 50,
    description: '专业财务团队提供 6 个月代理记账服务，含凭证整理、纳税申报、税务咨询。适合小微企业，账目清晰透明，一对一专属顾问对接。',
    coverImage: '/uploads/prod_finance.jpg',
  },
  {
    name: '高端商务名片盒礼盒',
    categoryName: '实体商品',
    price: 88,
    vipPrice: 69,
    stock: 500,
    description: '轻奢商务名片盒礼盒装，金属质感，印有社群专属 LOGO，附赠定制名片 50 张。送礼自用两相宜，彰显商务品味。',
    coverImage: '/uploads/prod_gift.jpg',
  },
];

async function main() {
  console.log('开始创建商品测试数据...');

  // 1. 查找或创建商品分类
  const categoryMap: Record<string, number> = {};
  for (const cat of categories) {
    let category = await prisma.productCategory.findFirst({ where: { name: cat.name } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { name: cat.name, parentId: cat.parentId, icon: '', sortOrder: 0, status: 1 },
      });
      console.log(`  ✓ 创建分类: ${cat.name}`);
    } else {
      console.log(`  - 分类已存在: ${cat.name}`);
    }
    categoryMap[cat.name] = category.id;
  }

  // 2. 幂等创建 4 条商品记录（按商品名判断，已存在则跳过，可重复执行）
  let created = 0;
  let skipped = 0;
  for (const prod of products) {
    const exists = await prisma.product.findFirst({ where: { name: prod.name } });
    if (exists) {
      console.log(`  - 已存在，跳过: ${prod.name}`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        name: prod.name,
        coverImage: prod.coverImage,
        images: '[]',
        description: prod.description,
        categoryId: categoryMap[prod.categoryName],
        price: prod.price,
        vipPrice: prod.vipPrice,
        stock: prod.stock,
        salesCount: 0,
        specs: '{}',
        status: 1,
      },
    });
    console.log(`  ✓ 创建商品: ${prod.name} (¥${prod.price})`);
    created++;
  }

  console.log(`\n本次新增 ${created} 条，跳过 ${skipped} 条。`);
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });