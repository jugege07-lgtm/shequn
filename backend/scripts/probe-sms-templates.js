// 探测当前用户凭证能够看到的 SMS 模板列表
// 用于在没拿到模板 ID 时反查
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
  const SmsClient = tencentcloud.sms.v20210111.Client;

  const cfg = {
    secretId: process.env.SMS_SECRET_ID,
    secretKey: process.env.SMS_SECRET_KEY,
    region: process.env.SMS_REGION || 'ap-guangzhou',
    sdkAppId: process.env.SMS_SDK_APP_ID,
  };

  if (!cfg.secretId || !cfg.secretKey || !cfg.sdkAppId) {
    console.error('[ERROR] 缺少凭证：secretId/secretKey/sdkAppId');
    process.exit(1);
  }

  console.log('[INFO] SdkAppId =', cfg.sdkAppId);
  console.log('[INFO] SecretId 前 6 位 =', String(cfg.secretId).slice(0, 6) + '***');

  const client = new SmsClient({
    credential: { secretId: cfg.secretId, secretKey: cfg.secretKey },
    region: cfg.region,
    profile: {
      signMethod: 'HmacSHA256',
      httpProfile: { endpoint: 'sms.tencentcloudapi.com', reqTimeout: 15 },
    },
  });

  // 1. 拉取签名列表（确认权限）
  console.log('\n[STEP 1] DescribeSmsSignList...');
  try {
    const signResp = await client.DescribeSmsSignList({ International: 0 });
    const signList = signResp?.DescribeSignStatusSet || [];
    console.log(`  -> ${signList.length} 个签名`);
    for (const s of signList) {
      console.log(`  签名 ID=${s.SignId}  内容="${s.SignName}"  类型=${s.SignType}  状态=${s.Status}（0=待审/1=已通过/2=已拒绝）`);
    }
  } catch (e) {
    console.error('  [WARN] 签名列表失败:', e?.message, e?.code);
  }

  // 2. 拉取模板列表
  console.log('\n[STEP 2] DescribeSmsTemplateList...');
  const allTemplates = [];
  try {
    let offset = 0;
    while (true) {
      const resp = await client.DescribeSmsTemplateList({
        International: 0,
        Limit: 100,
        Offset: offset,
      });
      const list = resp?.DescribeTemplateStatusSet || [];
      for (const t of list) {
        allTemplates.push({
          templateId: t.TemplateId,
          status: t.Status,
          statusText: { 0: '待审核', 1: '已通过', 2: '已拒绝' }[t.Status] || `状态${t.Status}`,
          type: t.Type,
          typeText: { 0: '通知', 1: '营销', 2: '行业' }[t.Type] || `类型${t.Type}`,
          name: t.TemplateName,
          content: t.TemplateContent,
          reviewed: t.ReviewReply,
        });
      }
      if (list.length < 100) break;
      offset += 100;
      if (offset > 1000) break;
    }
    console.log(`  -> ${allTemplates.length} 个模板\n`);
    for (const t of allTemplates) {
      console.log('  ----------------------------------------');
      console.log(`  模板 ID    : ${t.templateId}`);
      console.log(`  模板名称    : ${t.name}`);
      console.log(`  模板类型    : ${t.typeText}`);
      console.log(`  审核状态    : ${t.statusText}`);
      console.log(`  模板内容    : ${t.content}`);
      if (t.reviewed) console.log(`  审核备注    : ${t.reviewed}`);
    }
  } catch (e) {
    console.error('  [WARN] 模板列表失败:', e?.message, e?.code);
    if (e?.message?.includes('个人认证')) {
      console.error('  -> 您是个人认证，请登录 https://console.cloud.tencent.com/smsv2 查询模板');
    }
  }

  // 3. 选匹配"登录验证码"的模板建议
  const loginLike = allTemplates.filter((t) => /登录验证码|login|验证码/.test(t.content || ''));
  if (loginLike.length > 0) {
    console.log(`\n[建议] 找到 ${loginLike.length} 个匹配"登录验证码"的模板：`);
    for (const t of loginLike) {
      if (t.status === 1) {
        console.log(`  ✅ 推荐：模板 ID = ${t.templateId}  状态 = ${t.statusText}`);
      }
    }
  } else {
    console.log(`\n[WARN] 没找到匹配"登录验证码"的模板。请去腾讯云控制台创建模板。`);
  }

  process.exit(0);
})().catch((err) => {
  console.error('\n[FATAL]', err?.message || err);
  if (err?.code) console.error('code =', err.code);
  if (err?.requestId) console.error('requestId =', err.requestId);
  process.exit(1);
});
