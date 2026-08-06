/**
 * 校验微信支付配置与证书文件
 * 运行：npx ts-node -r dotenv/config scripts/verify-payment-config.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const requiredKeys = [
  'payment_channel',
  'payment_wx_appid',
  'payment_wx_secret',
  'payment_wx_mchid',
  'payment_wx_api_key',
  'payment_wx_notify_url',
  'payment_wx_refund_notify_url',
  'payment_wx_cert_path',
  'payment_wx_cert_key_path',
];

async function main() {
  const results: { item: string; status: 'ok' | 'missing' | 'error'; detail?: string }[] = [];

  for (const key of requiredKeys) {
    const cfg = await prisma.systemConfig.findUnique({ where: { key } });
    const value = cfg?.value || '';
    if (!value) {
      results.push({ item: key, status: 'missing', detail: '值为空' });
    } else {
      results.push({ item: key, status: 'ok', detail: key.includes('secret') || key.includes('key') || key.includes('appid') ? value.slice(0, 6) + '***' : value });
    }
  }

  // 证书文件
  const certPath = (await prisma.systemConfig.findUnique({ where: { key: 'payment_wx_cert_path' } }))?.value || '';
  const keyPath = (await prisma.systemConfig.findUnique({ where: { key: 'payment_wx_cert_key_path' } }))?.value || '';

  for (const [name, p] of [['cert', certPath], ['key', keyPath]] as const) {
    if (!p) {
      results.push({ item: `certificate_${name}`, status: 'missing', detail: '路径为空' });
    } else if (!fs.existsSync(p)) {
      results.push({ item: `certificate_${name}`, status: 'error', detail: `文件不存在: ${p}` });
    } else {
      const stat = fs.statSync(p);
      results.push({ item: `certificate_${name}`, status: 'ok', detail: `${path.basename(p)} (${stat.size} bytes)` });
    }
  }

  console.table(results);
  const okCount = results.filter((r) => r.status === 'ok').length;
  console.log(`\n校验结果: ${okCount}/${results.length} 项通过`);
  process.exit(results.some((r) => r.status !== 'ok') ? 1 : 0);
}

main()
  .catch((err) => {
    console.error('[verify] 失败', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
