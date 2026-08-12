import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderFromCartDto {
  @ApiProperty({ description: '购物车项ID数组', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  cartItemIds: number[];

  @ApiPropertyOptional({ description: '收货地址ID' })
  @IsOptional()
  @IsNumber()
  addressId?: number;

  @ApiPropertyOptional({ description: '订单备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '使用的优惠券ID（user_coupons 表 id）' })
  @IsOptional()
  @IsNumber()
  couponId?: number;
}
