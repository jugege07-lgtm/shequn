import { SetMetadata } from '@nestjs/common';

export const CONTENT_MODERATION_KEY = 'content-moderation';

/**
 * 声明该路由 body 中需要做敏感词审核的字段名列表
 * 用法：
 *   @ContentModeration(['title', 'description'])
 *   @UseGuards(ContentModerationGuard)
 */
export const ContentModeration = (...fields: string[]) =>
  SetMetadata(CONTENT_MODERATION_KEY, fields);
