import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 活动数据种子脚本
 * 创建 4 条不同分类的测试活动记录
 * - 2 条免费（0 费用）
 * - 2 条付费
 * - 状态均为 approved，便于移动端展示
 */
const activities = [
  {
    title: 'AI 产业应用线下沙龙',
    type: '沙龙',
    price: 0,
    location: '深圳市南山区科技园南区 腾讯大厦 3 楼报告厅',
    description: '聚焦 AI 大模型在产业中的应用落地，邀请一线技术专家分享实操案例，涵盖智能客服、内容生成、数据分析等场景。现场设自由交流环节，欢迎对 AI 应用感兴趣的企业主与开发者参加。',
    maxParticipants: 80,
    startDaysFromNow: 7,
    durationHours: 3,
    coverImage: '/uploads/act_ai_salon.jpg',
  },
  {
    title: '创业项目融资路演会',
    type: '路演',
    price: 29.9,
    location: '广州市天河区珠江新城 富力中心 20 楼路演大厅',
    description: '面向早期创业项目举办的路演对接会，邀请多家投资机构合伙人现场点评。每个项目 8 分钟路演 + 5 分钟问答，优秀项目可获后续一对一深入沟通机会。',
    maxParticipants: 50,
    startDaysFromNow: 14,
    durationHours: 4,
    coverImage: '/uploads/act_roadshow.jpg',
  },
  {
    title: '短视频运营实操工作坊',
    type: '工作坊',
    price: 0,
    location: '深圳市福田区 华强北路 华强电子世界 5 楼活动中心',
    description: '手把手带你从选题、脚本、拍摄到剪辑完成一条可发布的短视频。小班教学，限额 20 人，提供设备和素材，适合零基础新媒体从业者与个人创业者。',
    maxParticipants: 20,
    startDaysFromNow: 21,
    durationHours: 5,
    coverImage: '/uploads/act_workshop.jpg',
  },
  {
    title: '长三角企业家资源对接会',
    type: '会议',
    price: 49.9,
    location: '上海市浦东新区陆家嘴 中国金融信息中心 6 楼',
    description: '跨行业企业家资源对接闭门会议，按行业分组，围绕供应链、渠道、投融资等主题深度交流。定向邀请与公开报名结合，参会者均为企业主或高管。',
    maxParticipants: 100,
    startDaysFromNow: 30,
    durationHours: 6,
    coverImage: '/uploads/act_meeting.jpg',
  },
];

async function main() {
  console.log('开始创建活动测试数据...');

  // 1. 查找一个已存在的用户作为发布者
  const adminUser = await prisma.user.findFirst({
    where: { OR: [{ role: 'admin' }, { id: 1 }] },
  });

  if (!adminUser) {
    console.error('  ✗ 未找到用户，请先注册至少一个用户');
    return;
  }

  console.log(`  使用发布者: ${adminUser.nickname || `用户${adminUser.id}`} (ID: ${adminUser.id})`);

  // 2. 幂等创建 4 条活动记录（按标题判断，已存在则跳过，可重复执行）
  let created = 0;
  let skipped = 0;
  for (const act of activities) {
    const exists = await prisma.activity.findFirst({ where: { title: act.title } });
    if (exists) {
      console.log(`  - 已存在，跳过: ${act.title}`);
      skipped++;
      continue;
    }

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + act.startDaysFromNow);
    startTime.setHours(14, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + act.durationHours);

    await prisma.activity.create({
      data: {
        title: act.title,
        coverImage: act.coverImage,
        description: act.description,
        images: '[]',
        type: act.type,
        price: act.price,
        location: act.location,
        startTime,
        endTime,
        maxParticipants: act.maxParticipants,
        status: 'approved',
        publisherId: adminUser.id,
      },
    });
    const feeLabel = act.price === 0 ? '免费' : `¥${act.price}`;
    console.log(`  ✓ 创建活动: ${act.title} (${act.type}, ${feeLabel})`);
    created++;
  }

  console.log(`\n本次新增 ${created} 条，跳过 ${skipped} 条。`);
  console.log(`  免费活动: ${activities.filter(a => a.price === 0).length} 条，付费活动: ${activities.filter(a => a.price > 0).length} 条`);
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });