import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShipOrderDto {
  @ApiProperty({ description: '快递单号' })
  @IsString()
  shippingNo: string;

  @ApiProperty({ description: '快递公司名称' })
  @IsString()
  shippingCompany: string;
}

export class RejectRefundDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  reason: string;
}
