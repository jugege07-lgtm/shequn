/**
 * 初始化微信支付配置到 SystemConfig 表
 * 运行：npx ts-node -r dotenv/config scripts/seed-payment-config.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = [
    { key: 'payment_channel', value: 'wechat', description: '支付渠道：wechat / alipay' },
    { key: 'payment_wx_appid', value: process.env.WX_APPID || '', description: '微信支付 AppID' },
    { key: 'payment_wx_secret', value: process.env.WX_SECRET || '', description: '微信支付 Secret' },
    { key: 'payment_wx_mchid', value: process.env.WX_MCH_ID || '', description: '微信支付商户号' },
    { key: 'payment_wx_api_key', value: process.env.WX_API_V3_KEY || '', description: '微信支付 API 密钥' },
    { key: 'payment_wx_notify_url', value: process.env.WX_PAY_NOTIFY_URL || '', description: '微信支付回调地址' },
    { key: 'payment_wx_refund_notify_url', value: process.env.WX_REFUND_NOTIFY_URL || '', description: '微信支付退款回调地址' },
    { key: 'payment_wx_cert_path', value: process.env.WX_CERT_PATH || '', description: '微信支付 API 证书路径' },
    { key: 'payment_wx_cert_key_path', value: process.env.WX_CERT_KEY_PATH || '', description: '微信支付 API 证书私钥路径' },
    { key: 'payment_wx_p12_path', value: process.env.WX_P12_PATH || '', description: '微信支付 P12 证书路径' },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value, description: c.description },
      create: { key: c.key, value: c.value, description: c.description },
    });
    console.log(`[seed] ${c.key} = ${c.value ? '***' : '(empty)'}`);
  }

  console.log('[seed] 微信支付配置已同步到 SystemConfig');
}

main()
  .catch((err) => {
    console.error('[seed] 失败', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
