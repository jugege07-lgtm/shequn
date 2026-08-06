require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking database...');
  
  // Check users
  const users = await prisma.user.findMany({ select: { id: true, nickname: true, role: true } });
  console.log('\n👥 Users:', users.length);
  users.forEach(u => console.log(`  - ID:${u.id} Nickname:${u.nickname} Role:${u.role}`));
  
  // Check cards
  const cards = await prisma.userCard.findMany({ select: { id: true, userId: true, realName: true, company: true } });
  console.log('\n📇 Cards:', cards.length);
  cards.forEach(c => console.log(`  - ID:${c.id} User:${c.userId} Name:${c.realName} Company:${c.company}`));
  
  // Check activities
  const activities = await prisma.activity.findMany({ select: { id: true, title: true, status: true } });
  console.log('\n📅 Activities:', activities.length);
  activities.forEach(a => console.log(`  - ID:${a.id} Title:${a.title} Status:${a.status}`));
  
  // Check businesses
  const businesses = await prisma.business.findMany({ select: { id: true, title: true, status: true } });
  console.log('\n💼 Businesses:', businesses.length);
  businesses.forEach(b => console.log(`  - ID:${b.id} Title:${b.title} Status:${b.status}`));
  
  // Check products
  const products = await prisma.product.findMany({ select: { id: true, name: true, status: true } });
  console.log('\n🛍️ Products:', products.length);
  products.forEach(p => console.log(`  - ID:${p.id} Name:${p.name} Status:${p.status}`));
  
  // Check banners
  const banners = await prisma.banner.findMany({ select: { id: true, title: true, position: true } });
  console.log('\n🖼️ Banners:', banners.length);
  banners.forEach(b => console.log(`  - ID:${b.id} Title:${b.title} Position:${b.position}`));
  
  // Check announcements
  const announcements = await prisma.announcement.findMany({ select: { id: true, title: true } });
  console.log('\n📢 Announcements:', announcements.length);
  announcements.forEach(a => console.log(`  - ID:${a.id} Title:${a.title}`));
  
  // Check VIP plans
  const vipPlans = await prisma.vipPlan.findMany({ select: { id: true, name: true, currentPrice: true } });
  console.log('\n👑 VIP Plans:', vipPlans.length);
  vipPlans.forEach(v => console.log(`  - ID:${v.id} Name:${v.name} Price:${v.currentPrice}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
