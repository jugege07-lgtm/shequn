import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'wx.login 返回的 code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ required: false, description: '手机号登录时的 encryptedData' })
  @IsString()
  encryptedData?: string;

  @ApiProperty({ required: false, description: '手机号登录时的 iv' })
  @IsString()
  iv?: string;
}
