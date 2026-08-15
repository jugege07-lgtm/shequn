import { Injectable } from '@nestjs/common';

/**
 * 腾讯云文本内容安全（TMS）敏感词过滤服务
 *
 * 文档：https://cloud.tencent.com/document/product/1124/37119
 * - Content 需为 UTF-8 编码并以 Base64 格式传入，单次最长 5000 字符
 * - Suggestion: Pass（通过）/ Review（建议人工复审）/ Block（违规，直接拦截）
 *
 * 密钥复用腾讯云账号密钥（与 SMS 相同），可用 TMS_SECRET_ID/KEY 覆盖。
 * 未配置密钥或腾讯云接口异常时放行并打日志（fail-open），保证业务可用性；
 * 生产环境务必在腾讯云控制台开通「文本内容安全」服务并配置密钥。
 */
@Injectable()
export class TextModerationService {
  /** 单次送审最大字符数（超出截断，避免接口报错） */
  private static readonly MAX_LEN = 5000;

  private client: any = null;
  private clientKey: string = '';

  constructor() {
    const secretId = process.env.TMS_SECRET_ID || process.env.SMS_SECRET_ID;
    const secretKey = process.env.TMS_SECRET_KEY || process.env.SMS_SECRET_KEY;
    if (secretId && secretKey) {
      this.clientKey = `${secretId}:${secretKey}`;
      this.client = this.createClient(secretId, secretKey);
    } else {
      console.warn('[TextModeration] 未配置 TMS_SECRET_ID/KEY（也未配置 SMS_*），敏感词过滤未启用，内容将直接放行');
    }
  }

  private createClient(secretId: string, secretKey: string) {
    // require 放在工厂内：未配置密钥的环境不加载 SDK，避免冷启动开销
    const tencentcloud = require('tencentcloud-sdk-nodejs-tms');
    const TmsClient = tencentcloud.tms.v20201229.Client;
    return new TmsClient({
      credential: { secretId, secretKey },
      region: 'ap-guangzhou',
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: { endpoint: 'tms.tencentcloudapi.com', reqTimeout: 5 },
      },
    });
  }

  /** 密钥热更新（配置变更后无需重启进程的预留入口） */
  private ensureClient() {
    const secretId = process.env.TMS_SECRET_ID || process.env.SMS_SECRET_ID;
    const secretKey = process.env.TMS_SECRET_KEY || process.env.SMS_SECRET_KEY;
    if (!secretId || !secretKey) return null;
    const key = `${secretId}:${secretKey}`;
    if (!this.client || this.clientKey !== key) {
      this.clientKey = key;
      this.client = this.createClient(secretId, secretKey);
    }
    return this.client;
  }

  /**
   * 审核单段文本
   * @returns 命中违规时返回 { hit: true, keywords, label }；通过/放行时返回 { hit: false }
   */
  async checkText(text: string, dataId?: string): Promise<{ hit: boolean; keywords?: string[]; label?: string }> {
    const content = (text || '').trim();
    if (!content) return { hit: false };

    const client = this.ensureClient();
    if (!client) return { hit: false }; // 未配置密钥：放行

    try {
      const sliced = content.slice(0, TextModerationService.MAX_LEN);
      const resp = await client.TextModeration({
        Content: Buffer.from(sliced, 'utf8').toString('base64'),
        DataId: dataId,
      });
      const suggestion = resp?.Suggestion || 'Pass';
      if (suggestion === 'Block') {
        return { hit: true, keywords: resp?.Keywords || [], label: resp?.Label || '' };
      }
      if (suggestion === 'Review') {
        // 疑似违规不拦截（避免误伤正常内容），仅记录日志供后台复核
        console.warn('[TextModeration] Review(疑似违规)未拦截:', resp?.Label, resp?.Keywords, dataId || '');
      }
      return { hit: false };
    } catch (err: any) {
      // 接口异常时放行（fail-open），保证发布功能可用；打日志便于排查
      console.error('[TextModeration] 审核接口异常，本次放行:', err?.message || err);
      return { hit: false };
    }
  }

  /**
   * 批量审核多个命名字段（发布场景统一入口）
   * 任一字段命中即返回该字段名与关键词，全部通过返回 null
   */
  async checkFields(fields: Record<string, any>): Promise<{ field: string; keywords: string[] } | null> {
    for (const [field, value] of Object.entries(fields)) {
      let text = '';
      if (typeof value === 'string') {
        text = value;
      } else if (Array.isArray(value) || (value && typeof value === 'object')) {
        // tags / socialLinks 等结构化字段序列化后审核
        try { text = JSON.stringify(value); } catch { text = ''; }
      }
      if (!text.trim()) continue;
      const res = await this.checkText(text, field);
      if (res.hit) {
        return { field, keywords: res.keywords || [] };
      }
    }
    return null;
  }
}
