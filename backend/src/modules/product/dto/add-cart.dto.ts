import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartDto {
  @ApiProperty({ description: '商品ID' })
  @IsNumber()
  productId: number;

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: '规格 JSON' })
  @IsOptional()
  specs?: any;
}
