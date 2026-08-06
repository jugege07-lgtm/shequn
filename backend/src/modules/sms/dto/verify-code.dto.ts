import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SMS_SCENES, SmsScene } from './send-code.dto';

export class VerifyCodeDto {
  @ApiProperty({
    description: '手机号，需与接收验证码时一致（支持 +86 前缀）',
    example: '13800138000',
  })
  @IsString({ message: '手机号必须为字符串' })
  @Matches(/^(?:\+?86)?1[3-9]\d{9}$/, {
    message: '手机号格式不正确，请输入有效的 11 位手机号',
  })
  phone: string;

  @ApiProperty({
    description: '6 位数字验证码',
    example: '258963',
  })
  @IsString({ message: '验证码必须为字符串' })
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  code: string;

  @ApiProperty({
    description: '业务场景，需与发送时一致',
    required: false,
    enum: SMS_SCENES,
    default: 'login',
  })
  @IsOptional()
  @IsString()
  scene?: SmsScene;
}
