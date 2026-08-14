/**
 * 安全的 HTML 转义函数
 * 防止 XSS 攻击
 */
import { normalizeImageUrl } from './image'

export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * 将富文本 HTML 转换为纯文本（用于列表摘要等场景）
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  // 移除 script/style 标签内容
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // 替换 HTML 标签为换行或直接移除
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  // 解码常见 HTML 实体
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  // 去除多余空白行
  return cleaned.replace(/\n{3,}/g, '\n').trim();
}

/**
 * 安全地渲染富文本 HTML（用于详情页等需要保留格式的場景）
 * 仅保留安全的标签和属性，移除所有脚本和事件处理器
 * 
 * @param html - 原始富文本 HTML 字符串
 * @param maxLength - 可选：限制输出长度（用于列表摘要）
 */
export function sanitizeRichHtml(html: string, maxLength?: number): string {
  if (!html) return '';
  
  let cleaned = html;
  
  // 移除 script/style 标签及其内容
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // 移除所有事件处理器属性 (onclick, onerror, onload, onmouseover 等)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  
  // 移除 javascript: 和 data: 协议
  cleaned = cleaned.replace(/href\s*=\s*(?:["'])javascript:[^"']*["']/gi, 'href=""');
  cleaned = cleaned.replace(/src\s*=\s*(?:["'])javascript:[^"']*["']/gi, 'src=""');
  cleaned = cleaned.replace(/href\s*=\s*(?:["'])data:[^"']*["']/gi, 'href=""');
  
  // 允许的标签白名单
  const allowedTags = [
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code',
    'img', 'a',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'span', 'div', 'figure', 'figcaption',
  ];
  
  const allowedAttrs = [
    'src', 'alt', 'title', 'href', 'class', 'width', 'height',
    'colspan', 'rowspan', 'border', 'align', 'valign',
  ];
  
  // 保留允许的标签
  cleaned = cleaned.replace(/<([^>]+)>/g, (_, tagContent) => {
    // 解析标签名
    const tagMatch = tagContent.match(/^(\w+)/);
    if (!tagMatch) return '';
    const tagName = tagMatch[1].toLowerCase();
    
    // 检查是否在白名单中
    if (!allowedTags.includes(tagName)) {
      // 如果是自闭合标签或允许的内容标签则保留内容
      if (tagName === 'img' || tagName === 'br' || tagName === 'hr') {
        return '';
      }
      return '';
    }
    
    // 构建安全的标签字符串
    let safeTag = `<${tagName}`;
    
    // 解析属性
    const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(tagContent)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4];
      
      if (allowedAttrs.includes(attrName)) {
        safeTag += ` ${attrName}="${attrValue}"`;
      }
    }
    
    safeTag += '>';
    return safeTag;
  });
  
  // 处理自闭合标签
  cleaned = cleaned.replace(/<(img|br|hr)\s[^>]*\/?>/gi, (match) => {
    // 重新验证自闭合标签
    const tagMatch = match.match(/^<(img|br|hr)(\s[^>]*)?\s*\/?>/i);
    if (!tagMatch) return '';
    let safeTag = `<${tagMatch[1]}`;
    const attrs = tagMatch[2] || '';
    const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4];
      if (allowedAttrs.includes(attrName)) {
        safeTag += ` ${attrName}="${attrValue}"`;
      }
    }
    safeTag += '>';
    return safeTag;
  });
  
  // 修复富文本中 img 标签的固定像素宽度（防止移动端溢出）
  // 将 width="1920" 这类固定像素值移除，由 CSS max-width: 100% 接管
  cleaned = cleaned.replace(/<img(\s[^>]*)?>/gi, (match) => {
    let fixed = match;
    // 移除固定像素宽度和高度
    fixed = fixed.replace(/\s+width\s*=\s*["']?\d+px["']?/gi, '');
    fixed = fixed.replace(/\s+height\s*=\s*["']?\d+px["']?/gi, '');
    // 移除过大但不带单位的数值（如 width="1920"）
    fixed = fixed.replace(/\s+width\s*=\s*["']?\d{4,}["']?/gi, '');
    fixed = fixed.replace(/\s+height\s*=\s*["']?\d{4,}["']?/gi, '');
    // 重写 img src 为绝对地址：原生 App（Capacitor WebView origin=https://localhost 无 Caddy 代理）
    // 下相对路径 /uploads/xxx 会解析失败，必须用 normalizeImageUrl 补全为
    // https://www.jugekeji.com/api/uploads/xxx。H5 环境下 getApiBase() 返回空，保持相对路径由 Caddy 代理。
    fixed = fixed.replace(/src\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_, dq, sq) => {
      const v = dq ?? sq ?? ''
      return `src="${normalizeImageUrl(v)}"`
    });
    // 添加 data-role 便于 CSS 选择器匹配
    if (!fixed.includes('data-role=')) {
      fixed = fixed.replace('<img', '<img data-role="rich-image"');
    }
    return fixed;
  });
  
  // 限制长度
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    // 补全最后一个开放的标签
    const openTags: string[] = [];
    const tagRegex = /<(\/?)(\w+)[^>]*>/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(cleaned)) !== null) {
      const [, closing, name] = tagMatch;
      const selfClosing = ['br', 'hr', 'img'];
      if (selfClosing.includes(name)) continue;
      if (closing) {
        openTags.pop();
      } else {
        openTags.push(name);
      }
    }
    for (let i = openTags.length - 1; i >= 0; i--) {
      cleaned += `</${openTags[i]}>`;
    }
  }
  
  return cleaned;
}

/**
 * 安全的价格 HTML 生成
 * 只允许数字和货币符号
 */
export function generateSafePriceHtml(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return '¥0';
  }
  return `¥${numPrice.toFixed(2)}`;
}

/**
 * 安全的格式化价格 HTML
 */
export function formatPriceHtml(price: number | string, isFree: boolean = false): string {
  if (isFree) {
    return '免费';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return '¥0';
  }
  return `<span>¥</span>${numPrice}`;
}
