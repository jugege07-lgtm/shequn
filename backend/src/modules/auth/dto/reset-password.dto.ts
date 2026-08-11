import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(4, 6, { message: '验证码长度为 4-6 位' })
  code: string;

  @ApiProperty({ description: '新密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 32, { message: '新密码长度需为 6-32 位' })
  password: string;
}