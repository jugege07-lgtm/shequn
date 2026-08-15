import { Global, Module } from '@nestjs/common';
import { TextModerationService } from './text-moderation.service';
import { ContentModerationGuard } from './content-moderation.guard';

/** 全局模块：各业务控制器直接 @UseGuards(ContentModerationGuard) 使用 */
@Global()
@Module({
  providers: [TextModerationService, ContentModerationGuard],
  exports: [TextModerationService, ContentModerationGuard],
})
export class ModerationModule {}
