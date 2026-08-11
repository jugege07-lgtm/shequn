import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 检查是否已有数据，避免重复插入
  const existingConfigs = await prisma.systemConfig.count();
  if (existingConfigs > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  // 系统配置
  await prisma.systemConfig.createMany({
    data: [
      { key: 'app_name', value: '社群名片', description: '应用名称' },
      { key: 'app_description', value: '连接优质资源，成就商业梦想', description: '应用描述' },
      { key: 'contact_phone', value: '400-123-4567', description: '客服电话' },
      { key: 'contact_email', value: 'support@example.com', description: '客服邮箱' },
      { key: 'maintenance_mode', value: 'false', description: '是否维护模式' },
      { key: 'maintenance_message', value: '系统维护中，请稍后再试', description: '维护提示语' },
    ],
  });

  // 公告
  await prisma.announcement.createMany({
    data: [
      { title: '欢迎加入社群名片', content: '连接优质资源，成就商业梦想！立即完善你的名片信息，开启社群之旅。', type: 'notice', sortOrder: 0, status: 1 },
      { title: 'VIP会员权益升级', content: 'VIP会员现已支持更多专属权益，立即开通享受更多福利！', type: 'notice', sortOrder: 1, status: 1 },
    ],
  });

  // Banners
  await prisma.banner.createMany({
    data: [
      { title: '2026 社群商业资源峰会', content: '7月15日 · 深圳国际会展中心 · 限额500人', imageUrl: '', linkUrl: '/activity/detail/1', linkType: 'activity', position: 'home', sortOrder: 0, status: 1 },
      { title: 'VIP会员专属福利', content: '解锁专属权益 · 享受更多折扣', imageUrl: '', linkUrl: '/vip/index', linkType: 'vip', position: 'home', sortOrder: 1, status: 1 },
    ],
  });

  // 首页版块
  await prisma.homeSection.createMany({
    data: [
      { name: '热门活动', key: 'hot_activities', title: '热门活动', subtitle: '最新社群活动', config: '{"displayCount": 4}', sortOrder: 0, status: 1 },
      { name: '最新商机', key: 'latest_businesses', title: '最新商机', subtitle: '优质资源对接', config: '{"displayCount": 4}', sortOrder: 1, status: 1 },
    ],
  });

  // 初始版本
  await prisma.appVersion.createMany({
    data: [
      { platform: 'mobile', version: '1.0.0', versionCode: 1, title: '初始版本', content: '社群名片小程序正式上线', downloadUrl: '', forceUpdate: 0, status: 1 },
    ],
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
