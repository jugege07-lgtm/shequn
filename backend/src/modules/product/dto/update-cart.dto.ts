import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartDto {
  @ApiProperty({ description: '数量' })
  @IsNumber()
  @Min(1)
  quantity: number;
}
