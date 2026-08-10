import { IsNotEmpty, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: '商品ID' })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ description: '购买数量' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: '收货地址ID' })
  @IsOptional()
  @IsNumber()
  addressId?: number;

  @ApiPropertyOptional({ description: '请求唯一标识，用于防重复提交（幂等性）' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ description: '订单备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '支付类型：cash=纯现金 points=纯积分兑换 points_cash=积分+现金组合' })
  @IsOptional()
  @IsString()
  payType?: string;

  @ApiPropertyOptional({ description: '组合支付时用户希望使用的积分数量（可选，不传则默认用满）' })
  @IsOptional()
  @IsNumber()
  pointsUsed?: number;
}
