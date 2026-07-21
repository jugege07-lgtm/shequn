import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';

/**
 * 短信验证码模块
 *
 * 全局模块，便于 auth 等模块直接注入使用，无需在每个模块重复 import
 */
@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
