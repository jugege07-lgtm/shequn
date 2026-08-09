import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { RequestConnectionDto } from './dto/request-connection.dto';
import { RespondConnectionDto } from './dto/respond-connection.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('大咖人脉')
@Controller('api')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Get('public/connections/config')
  @ApiOperation({ summary: '获取大咖人脉功能配置（最低VIP级别）' })
  async getConfig() {
    return { code: 0, data: await this.connectionService.getDajiaConfig() };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connections/recommendations')
  @ApiOperation({ summary: '获取大咖推荐列表（需VIP）' })
  async getRecommendations(@CurrentUser() user: any) {
    const data = await this.connectionService.getRecommendations(user.userId, user);
    return { code: 0, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('connections/request')
  @ApiOperation({ summary: '发起联系请求（需VIP）' })
  async requestConnection(@CurrentUser() user: any, @Body() dto: RequestConnectionDto) {
    const data = await this.connectionService.requestConnection(user.userId, user, dto.targetId);
    return { code: 0, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connections/my')
  @ApiOperation({ summary: '获取我的人脉列表' })
  async getMyConnections(@CurrentUser() user: any) {
    return { code: 0, data: await this.connectionService.getMyConnections(user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connections/requests')
  @ApiOperation({ summary: '获取我收到的待确认人脉申请' })
  async getRequests(@CurrentUser() user: any) {
    return { code: 0, data: await this.connectionService.getRequests(user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('connections/:id/respond')
  @ApiOperation({ summary: '同意/拒绝人脉申请' })
  async respond(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondConnectionDto,
  ) {
    const data = await this.connectionService.respond(user.userId, id, dto.accept);
    return { code: 0, data };
  }
}