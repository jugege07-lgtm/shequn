// 端到端真实发送测试：通过 HTTP 调 /api/auth/send-code 触发 SmsService → 腾讯云 SDK 真实下发
// 用法: node scripts/test-real-sms.js <11位手机号>
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const phone = process.argv[2];
if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
  console.error('用法: node scripts/test-real-sms.js <11位手机号>');
  console.error('示例: node scripts/test-real-sms.js 13800138000');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const url = `http://127.0.0.1:${PORT}/api/auth/send-code`;

(async () => {
  console.log(`[INFO] 调用 ${url}`);
  console.log(`[INFO] 目标手机号 = ${phone}`);
  console.log(`[INFO] SMS_MOCK = ${process.env.SMS_MOCK}`);
  console.log(`[INFO] SMS_TEMPLATE_ID = ${process.env.SMS_TEMPLATE_ID}`);
  console.log(`[INFO] SMS_SIGN_NAME = ${process.env.SMS_SIGN_NAME}`);
  console.log('');

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, scene: 'login' }),
    });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    console.log(`[RESP] HTTP ${r.status}`);
    console.log('[RESP] body =', JSON.stringify(body, null, 2));
    // 后端外层包装是 {code:0, message, data:{success:true,...}}，内部 data.success 才是业务成功
    const bizSuccess = r.ok && (body?.code === 0 || body?.success === true) && (body?.data?.success === true || body?.sent === true);
    if (bizSuccess) {
      console.log('\n✅ 调用成功');
      if (body?.devCode) console.log(`   [MOCK 模式] 验证码 = ${body.devCode}`);
      else console.log('   [真实模式] 验证码已下发，请注意查收短信');
    } else {
      console.log('\n❌ 调用失败');
      console.log(`   外层: code=${body?.code} message=${body?.message}`);
      if (body?.data?.message) console.log(`   内层: ${body.data.message}`);
    }
  } catch (e) {
    console.error('[FATAL]', e.message);
  }
  process.exit(0);
})();
