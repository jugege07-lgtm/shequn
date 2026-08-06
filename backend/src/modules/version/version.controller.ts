import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VersionService } from './version.service';

@ApiTags('版本管理')
@Controller('api')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  // ========== Public: Check update ==========
  @Get('public/version/check')
  @ApiOperation({ summary: '检查版本更新（公开）' })
  async checkUpdate(@Query('platform') platform: string, @Query('versionCode') versionCode: string) {
    return this.versionService.checkUpdate(platform, parseInt(versionCode) || 0);
  }
}