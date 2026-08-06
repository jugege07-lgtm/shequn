import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

/**
 * 短信验证码模块
 *
 * 声明为 @Global，应用启动时在 AppModule 中导入一次即可；
 * 其它模块（如 AuthModule）可直接注入 SmsService，无需重复 import。
 */
@Global()
@Module({
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
