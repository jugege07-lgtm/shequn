/**
 * 微信支付配置写入 system_config（可重复执行，upsert）
 * 运行：npx ts-node prisma/seed-payment.ts（或编译后 node dist/prisma/seed-payment.js）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 商户证书目录：backend/certificates/（已加入 .gitignore，部署时需手动同步到服务器）
const CERT_DIR = 'certificates';

const PAYMENT_CONFIGS: { key: string; value: string; description: string }[] = [
  { key: 'payment_channel', value: 'wechat', description: '支付渠道' },
  { key: 'payment_wx_appid', value: 'wxd3d7211a57ab6a83', description: '微信小程序 AppID' },
  { key: 'payment_wx_secret', value: '', description: '小程序 AppSecret（待补充）' },
  { key: 'payment_wx_mchid', value: '1601215643', description: '微信支付商户号' },
  { key: 'payment_wx_api_key', value: '8LuMNbNUfcmtkpxloXesFR7Vl1ze3W5p', description: 'APIv3 密钥' },
  { key: 'payment_wx_serial_no', value: '1DBBCE2C5A4A507166E531D23BDF348488DE4E38', description: '商户 API 证书序列号' },
  { key: 'payment_wx_platform_public_key_path', value: `${CERT_DIR}/pub_key.pem`, description: '微信支付公钥文件（商户平台下载，用于回调验签）' },
  { key: 'payment_wx_notify_url', value: 'https://www.jugekeji.com/api/pay/wechat/notify', description: '支付回调地址' },
  { key: 'payment_wx_refund_notify_url', value: 'https://www.jugekeji.com/api/pay/wechat/refund-notify', description: '退款回调地址' },
  { key: 'payment_wx_cert_path', value: `${CERT_DIR}/apiclient_cert.pem`, description: '商户 API 证书（公钥）' },
  { key: 'payment_wx_cert_key_path', value: `${CERT_DIR}/apiclient_key.pem`, description: '商户 API 证书私钥' },
  { key: 'payment_wx_p12_path', value: `${CERT_DIR}/apiclient_cert.p12`, description: '商户 API 证书 p12（退款等场景备用）' },
];

async function main() {
  for (const c of PAYMENT_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value, description: c.description },
      create: c,
    });
    console.log(`✔ ${c.key} = ${c.key.includes('key') || c.key.includes('secret') ? '***' : c.value}`);
  }
  console.log('\n微信支付配置写入完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
