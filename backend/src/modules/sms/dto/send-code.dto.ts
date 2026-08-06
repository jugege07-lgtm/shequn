import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 允许的验证码业务场景 */
export const SMS_SCENES = ['login', 'register', 'reset_password', 'bind_phone'] as const;
export type SmsScene = (typeof SMS_SCENES)[number];

export class SendCodeDto {
  @ApiProperty({
    description: '手机号，支持 +86 前缀，例如 13800138000 或 +8613800138000',
    example: '13800138000',
  })
  @IsString({ message: '手机号必须为字符串' })
  @Matches(/^(?:\+?86)?1[3-9]\d{9}$/, {
    message: '手机号格式不正确，请输入有效的 11 位手机号',
  })
  phone: string;

  @ApiProperty({
    description: '业务场景',
    required: false,
    enum: SMS_SCENES,
    default: 'login',
  })
  @IsOptional()
  @IsString()
  scene?: SmsScene;
}
