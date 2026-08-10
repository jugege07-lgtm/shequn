import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('商机')
@Controller('api')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('public/businesses')
  @ApiOperation({ summary: '获取商机列表（公开）' })
  async getPublicBusinesses(@Query() query: any) {
    return { code: 0, data: await this.businessService.getPublicBusinesses(query) };
  }

  @Get('public/business-categories')
  @ApiOperation({ summary: '获取商机分类列表（公开）' })
  async getBusinessCategories() {
    return { code: 0, data: await this.businessService.getBusinessCategories() };
  }

  @Get('public/businesses/:id')
  @ApiOperation({ summary: '获取商机详情（公开）' })
  async getBusinessDetail(@Param('id') id: string) {
    return { code: 0, data: await this.businessService.getBusinessDetail(Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('businesses')
  @ApiOperation({ summary: '创建商机' })
  async createBusiness(@Body() dto: CreateBusinessDto, @CurrentUser() user: any) {
    return { code: 0, data: await this.businessService.createBusiness(dto, user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('businesses/:id/unlock-status')
  @ApiOperation({ summary: '获取当前用户商机解锁状态' })
  async getUnlockStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.businessService.getUnlockStatus(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('businesses/:id/unlock')
  @ApiOperation({ summary: '解锁商机联系方式' })
  async unlockBusiness(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.businessService.unlockBusiness(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('businesses/free-unlock/stats')
  @ApiOperation({ summary: '获取当前用户免费商机解锁月度统计' })
  async getFreeUnlockStats(@CurrentUser() user: any) {
    return { code: 0, data: await this.businessService.getFreeUnlockStats(user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('businesses/my')
  @ApiOperation({ summary: '获取我的商机' })
  async getMyBusinesses(@CurrentUser() user: any, @Query() query: any) {
    return { code: 0, data: await this.businessService.getMyBusinesses(user.userId, query) };
  }
}
