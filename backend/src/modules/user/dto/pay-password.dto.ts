import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** 设置 / 修改支付密码 */
export class SetPayPasswordDto {
  @ApiPropertyOptional({ description: '支付密码（6-20位）', example: '123456' })
  @IsString()
  @MinLength(6, { message: '支付密码至少6位' })
  @MaxLength(20, { message: '支付密码不能超过20位' })
  payPassword: string;

  @ApiPropertyOptional({ description: '短信验证码（修改时必填，首次设置可空）', example: '123456' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '手机号（修改时必填）', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;
}