import { Controller, Post, Body, HttpCode, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

/**
 * 短信验证码接口（公开，无需登录）
 * - POST /api/sms/send   发送验证码
 * - POST /api/sms/verify 校验验证码（校验通过后立即失效）
 */
@ApiTags('短信验证码')
@Controller('api/sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(200)
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiBody({ type: SendCodeDto })
  @ApiResponse({ status: 200, description: '发送成功（模拟模式下响应含 devCode）' })
  async send(@Body() dto: SendCodeDto, @Req() req: any) {
    const clientIp =
      (req?.headers && (req.headers['x-forwarded-for'] || req.ip)) || undefined;
    return await this.smsService.sendCode(dto.phone, dto.scene || 'login', clientIp);
  }

  @Post('verify')
  @HttpCode(200)
  @ApiOperation({ summary: '校验短信验证码（一次性，校验通过后立即失效）' })
  @ApiBody({ type: VerifyCodeDto })
  async verify(@Body() dto: VerifyCodeDto) {
    const ok = this.smsService.verify(dto.phone, dto.code, dto.scene || 'login');
    if (!ok) {
      throw new BadRequestException('验证码错误、已过期或已使用');
    }
    return { verified: true };
  }
}
