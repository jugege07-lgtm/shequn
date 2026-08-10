import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 商机数据种子脚本
 * 创建 8 条不同行业的转介绍客户需求记录
 * - 4 条免费（0 费用）
 * - 4 条付费（≤50 元）
 * - 免费与付费交替排列
 */

const categories = [
  { name: 'IT互联网', code: 'it' },
  { name: '市场营销', code: 'marketing' },
  { name: '金融投资', code: 'finance' },
  { name: '教育培训', code: 'education' },
  { name: '医疗健康', code: 'healthcare' },
  { name: '房地产', code: 'realestate' },
  { name: '制造业', code: 'manufacturing' },
  { name: '电商零售', code: 'ecommerce' },
];

const businesses = [
  {
    title: '软件开发外包需求',
    categoryCode: 'it',
    contactName: '张经理',
    contactPhone: '138****1234',
    contactWechat: 'zhang_dev_2024',
    description: '某大型互联网公司急需 Java 后端开发团队，承接电商平台二期建设。项目周期 6 个月，预算充足，要求团队有电商系统开发经验。',
    unlockFee: 0,
    maxUnlocks: 20,
  },
  {
    title: '品牌推广渠道对接',
    categoryCode: 'marketing',
    contactName: '李总监',
    contactPhone: '139****5678',
    contactWechat: 'li_marketing',
    description: '新消费品牌寻找抖音/小红书达人推广渠道，预算 50 万/月。需有食品饮料类目推广经验的 MCN 机构或达人团队对接。',
    unlockFee: 19.9,
    maxUnlocks: 15,
  },
  {
    title: '投融资项目对接',
    categoryCode: 'finance',
    contactName: '王总',
    contactPhone: '136****9012',
    contactWechat: 'wang_invest',
    description: '新能源创业项目寻求 A 轮融资，融资金额 2000 万。已获天使轮，产品已上线，月活 10 万+。寻找关注新能源赛道的投资机构。',
    unlockFee: 0,
    maxUnlocks: 10,
  },
  {
    title: '在线教育招生合作',
    categoryCode: 'education',
    contactName: '陈校长',
    contactPhone: '137****3456',
    contactWechat: 'chen_edu',
    description: '职业教育机构寻找招生渠道合作，CPA/CPS 模式均可。主打 IT 技能培训和职业考证，客单价 3000-8000 元，佣金丰厚。',
    unlockFee: 29.9,
    maxUnlocks: 25,
  },
  {
    title: '医疗器械渠道合作',
    categoryCode: 'healthcare',
    contactName: '刘经理',
    contactPhone: '135****7890',
    contactWechat: 'liu_medical',
    description: '二类医疗器械厂家寻找区域代理商和医院渠道。产品包括家用呼吸机、制氧机等，已有医疗器械注册证，利润空间大。',
    unlockFee: 0,
    maxUnlocks: 12,
  },
  {
    title: '房产中介客户转介绍',
    categoryCode: 'realestate',
    contactName: '赵店长',
    contactPhone: '186****2345',
    contactWechat: 'zhao_house',
    description: '上海高端房产中介寻找企业客户转介绍渠道。主营豪宅和商业地产，单客佣金 10 万起，介绍费 1% 起，上不封顶。',
    unlockFee: 39.9,
    maxUnlocks: 8,
  },
  {
    title: '供应链采购对接',
    categoryCode: 'manufacturing',
    contactName: '孙工',
    contactPhone: '188****6789',
    contactWechat: 'sun_factory',
    description: '大型家电制造企业寻找精密注塑件供应商，年采购量 500 万+。要求供应商有 ISO9001 认证，能配合开模打样。',
    unlockFee: 0,
    maxUnlocks: 15,
  },
  {
    title: '电商运营资源对接',
    categoryCode: 'ecommerce',
    contactName: '周运营',
    contactPhone: '187****0123',
    contactWechat: 'zhou_ec',
    description: '天猫 TOP 美妆品牌寻找代运营团队和直播带货渠道。年销 5000 万+，有成熟供应链和品牌力，寻求运营升级合作。',
    unlockFee: 49.9,
    maxUnlocks: 20,
  },
];

async function main() {
  console.log('开始创建商机分类和示例数据...');

  // 1. 查找或创建分类
  const categoryMap: Record<string, number> = {};
  for (const cat of categories) {
    let category = await prisma.businessCategory.findUnique({ where: { code: cat.code } });
    if (!category) {
      category = await prisma.businessCategory.create({
        data: { name: cat.name, code: cat.code, icon: '', sortOrder: 0, status: 1 },
      });
      console.log(`  ✓ 创建分类: ${cat.name}`);
    } else {
      console.log(`  - 分类已存在: ${cat.name}`);
    }
    categoryMap[cat.code] = category.id;
  }

  // 2. 查找一个已存在的用户作为发布者
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'admin' },
        { id: 1 },
      ],
    },
  });

  if (!adminUser) {
    console.error('  ✗ 未找到用户，请先注册至少一个用户');
    return;
  }

  console.log(`  使用发布者: ${adminUser.nickname || adminUser.realName || `用户${adminUser.id}`} (ID: ${adminUser.id})`);

  // 3. 直接创建 8 条商机记录（追加模式）
  console.log(`  当前已有商机数据，追加创建 ${businesses.length} 条新记录...`);

  // 4. 创建商机记录
  for (const biz of businesses) {
    const categoryId = categoryMap[biz.categoryCode];
    await prisma.business.create({
      data: {
        title: biz.title,
        coverImage: '',
        description: biz.description,
        categoryId,
        contactName: biz.contactName,
        contactPhone: biz.contactPhone,
        contactWechat: biz.contactWechat,
        unlockFee: biz.unlockFee,
        maxUnlocks: biz.maxUnlocks,
        currentUnlocks: 0,
        status: 'approved',
        publisherId: adminUser.id,
      },
    });
    const feeLabel = biz.unlockFee === 0 ? '免费' : `¥${biz.unlockFee}`;
    console.log(`  ✓ 创建商机: ${biz.title} (${feeLabel})`);
  }

  console.log(`\n成功创建 ${businesses.length} 条商机记录！`);
  console.log(`  免费商机: ${businesses.filter(b => b.unlockFee === 0).length} 条`);
  console.log(`  付费商机: ${businesses.filter(b => b.unlockFee > 0).length} 条`);
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
