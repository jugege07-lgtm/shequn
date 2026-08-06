import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ description: '活动标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '封面图URL' })
  @IsString()
  coverImage: string;

  @ApiProperty({ description: '活动描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '活动图片列表(JSON字符串)', required: false })
  @IsString()
  @IsOptional()
  images?: string;

  @ApiProperty({ description: '活动类型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '价格', required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ description: '地点' })
  @IsString()
  location: string;

  @ApiProperty({ description: '开始时间' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: '最大参与人数', required: false })
  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @ApiProperty({ description: '纬度', required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: '经度', required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
