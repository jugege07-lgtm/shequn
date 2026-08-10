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

  // ===== 积分购买配置 =====
  @ApiProperty({ description: '积分购买: 0=关闭 1=纯积分 2=积分+现金', required: false })
  @IsNumber()
  @IsOptional()
  pointsEnabled?: number;

  @ApiProperty({ description: '纯积分兑换：每件所需积分', required: false })
  @IsNumber()
  @IsOptional()
  pointsPrice?: number;

  @ApiProperty({ description: '组合支付：最低使用积分门槛', required: false })
  @IsNumber()
  @IsOptional()
  pointsMinLimit?: number;

  @ApiProperty({ description: '组合支付：单笔最高可抵扣积分(0=不限)', required: false })
  @IsNumber()
  @IsOptional()
  pointsMaxLimit?: number;

  @ApiProperty({ description: '抵扣模式: fixed=固定 ratio=按比例', required: false })
  @IsString()
  @IsOptional()
  pointsDeductMode?: string;

  @ApiProperty({ description: '兑换汇率：N 积分抵 1 元', required: false })
  @IsNumber()
  @IsOptional()
  pointsRate?: number;

  @ApiProperty({ description: '比例抵扣：可抵商品价格百分比(0-100)', required: false })
  @IsNumber()
  @IsOptional()
  pointsRatioPercent?: number;

  @ApiProperty({ description: '比例抵扣：单笔最高抵扣金额(元,0=不限)', required: false })
  @IsNumber()
  @IsOptional()
  pointsMaxDeduct?: number;
}
