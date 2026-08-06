import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('内容管理')
@Controller('api')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ========== Public: Homepage data ==========
  @Get('public/homepage')
  @ApiOperation({ summary: '获取首页数据（公开）' })
  async getHomepage() {
    return this.contentService.getHomepageData();
  }

  @Get('public/announcements')
  @ApiOperation({ summary: '获取公告列表（公开）' })
  async getPublicAnnouncements() {
    return this.contentService.getAnnouncements();
  }

  @Get('public/banners')
  @ApiOperation({ summary: '获取Banner列表（公开）' })
  async getPublicBanners(@Query('position') position?: string) {
    return this.contentService.getBanners(position);
  }

  @Get('public/sections')
  @ApiOperation({ summary: '获取首页版块配置（公开）' })
  async getPublicSections() {
    return this.contentService.getHomeSections();
  }
}