import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RequestConnectionDto {
  @ApiProperty({ description: '被联系的大咖用户 ID' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: '目标用户不能为空' })
  targetId: number;
}