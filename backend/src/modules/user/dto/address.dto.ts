import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: '收货人姓名' })
  @IsString()
  receiver: string;

  @ApiProperty({ description: '手机号' })
  @IsString()
  phone: string;

  @ApiProperty({ description: '省份' })
  @IsString()
  province: string;

  @ApiProperty({ description: '城市' })
  @IsString()
  city: string;

  @ApiProperty({ description: '区县' })
  @IsString()
  district: string;

  @ApiProperty({ description: '详细地址' })
  @IsString()
  detail: string;

  @ApiPropertyOptional({ description: '是否默认：1 默认，0 非默认' })
  @IsOptional()
  @IsNumber()
  isDefault?: number;
}
