import { BadRequestException } from '@nestjs/common';

/**
 * 内容审核未通过异常
 * 响应体携带 moderation: true 标记与命中关键词，前端据此弹「内容违规」提示框而非普通 toast
 */
export class ContentModerationException extends BadRequestException {
  constructor(field: string, keywords: string[] = []) {
    super({
      message: '内容包含违规词汇，请修改后重新发布',
      moderation: true,
      field,
      keywords,
    });
  }
}
