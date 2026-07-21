import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: '商品名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '封面图URL', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ description: '商品描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '商品分类ID', required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'VIP价格', required: false })
  @IsNumber()
  @IsOptional()
  vipPrice?: number;

  @ApiProperty({ description: '库存' })
  @IsNumber()
  stock: number;

  @ApiProperty({ description: '状态: 1=上架, 0=下架' })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiProperty({ description: '商品图片列表 JSON', required: false })
  @IsString()
  @IsOptional()
  images?: string;

  @ApiProperty({ description: '商品规格 JSON', required: false })
  @IsString()
  @IsOptional()
  specs?: string;
}
