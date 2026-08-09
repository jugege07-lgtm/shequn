import { Controller, Get, Param, Query } from '@nestjs/common';
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

  /** 大屏聚合统计（公开，无鉴权） */
  @Get('big-screen')
  @ApiOperation({ summary: '数据大屏聚合统计（公开）' })
  async getBigScreenStats() {
    return this.systemService.getBigScreenStats();
  }

  /** 大屏底部滚动播报：最近 24h 内的新增数据（公开，无鉴权） */
  @Get('recent-activities')
  @ApiOperation({ summary: '大屏：近期新增动态（最近24h，公开）' })
  async getRecentActivities(@Query('limit') limit?: string) {
    const n = Math.max(1, Math.min(50, parseInt(limit || '20', 10) || 20));
    const data = await this.systemService.getRecentActivities(n);
    return { code: 0, data };
  }
}