import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBusinessDto {
  @ApiProperty({ description: '商机标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '封面图URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: '商机描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '分类ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  categoryId: number;

  @ApiProperty({ description: '联系人' })
  @IsString()
  contactName: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '联系微信' })
  @IsOptional()
  @IsString()
  contactWechat?: string;

  @ApiPropertyOptional({ description: '解锁费用（元），0为免费', required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  unlockFee?: number;

  @ApiPropertyOptional({ description: '最大解锁次数，默认3次', required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  maxUnlocks?: number;
}
