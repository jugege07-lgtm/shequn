import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBusinessDto {
  @ApiProperty({ description: '商机标题' })
  @IsNotEmpty({ message: '商机标题不能为空' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '封面图片URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: '商机描述' })
  @IsNotEmpty({ message: '商机描述不能为空' })
  @IsString()
  description: string;

  @ApiProperty({ description: '所属分类ID' })
  @IsNotEmpty({ message: '请选择商机分类' })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: '分类ID必须为数字' })
  @Min(1, { message: '分类ID无效' })
  categoryId: number;

  @ApiProperty({ description: '联系人姓名' })
  @IsNotEmpty({ message: '联系人不能为空' })
  @IsString()
  contactName: string;

  @ApiPropertyOptional({ description: '联系人电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '联系人微信' })
  @IsOptional()
  @IsString()
  contactWechat?: string;

  @ApiPropertyOptional({ description: '解锁费用（元），0为免费' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: '解锁费用必须为数字' })
  @Min(0, { message: '解锁费用不能为负数' })
  unlockFee?: number;

  @ApiPropertyOptional({ description: '最大解锁次数，默认3次' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: '解锁次数必须为数字' })
  @Min(1, { message: '解锁次数至少为1次' })
  @Max(100, { message: '解锁次数不能超过100次' })
  maxUnlocks?: number;
}
