import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondConnectionDto {
  @ApiProperty({ description: '是否同意（true=同意，false=拒绝）' })
  @IsBoolean()
  @IsNotEmpty({ message: '请选择同意或拒绝' })
  accept: boolean;
}