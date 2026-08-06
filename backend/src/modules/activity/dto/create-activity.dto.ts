import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ description: '活动标题' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '封面图片URL' })
  @IsNotEmpty()
  @IsString()
  coverImage: string;

  @ApiProperty({ description: '活动描述' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: '活动图片列表', default: '[]' })
  @IsOptional()
  @IsString()
  images?: string;

  @ApiProperty({ description: '活动类型' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: '活动价格' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: '活动地点' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: '纬度' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: '经度' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ description: '开始时间' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: '最大参与人数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @ApiPropertyOptional({ description: '请求唯一标识，用于防重复提交（幂等性）' })
  @IsOptional()
  @IsString()
  requestId?: string;
}
