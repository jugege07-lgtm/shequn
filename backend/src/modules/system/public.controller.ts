import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';

@ApiTags('公开接口')
@Controller('api/public')
export class PublicController {
  constructor(private readonly systemService: SystemService) {}

  @Get('config/:key')
  @ApiOperation({ summary: '获取系统配置（公开）' })
  async getConfig(@Param('key') key: string) {
    return { key, value: await this.systemService.getConfig(key) };
  }
}