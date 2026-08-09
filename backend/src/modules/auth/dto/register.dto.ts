import { IsNotEmpty, IsString, IsOptional, IsInt, Matches, Length, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(4, 6, { message: '验证码长度为 4-6 位' })
  code: string;

  @ApiProperty({ description: '真实姓名', example: '张三' })
  @IsString()
  @IsNotEmpty({ message: '真实姓名不能为空' })
  realName: string;

  @ApiProperty({ required: false, description: '登录密码（至少 6 位），不传则使用默认 123456', minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: '密码至少 6 位' })
  password?: string;

  @ApiProperty({ required: false, description: '昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ required: false, description: '公司名称' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ required: false, description: '职位' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ required: false, description: '微信号' })
  @IsString()
  @IsOptional()
  wechat?: string;

  @ApiProperty({ required: false, description: '个人简介' })
  @IsString()
  @IsOptional()
  intro?: string;

  @ApiProperty({ required: false, description: '头像 URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ required: false, description: '推荐人用户 ID（扫码名片注册时携带）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '推荐人 ID 格式不正确' })
  referrerId?: number;
}
