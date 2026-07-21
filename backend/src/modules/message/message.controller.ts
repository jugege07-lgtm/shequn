import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('消息')
@Controller('api')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('messages')
  @ApiOperation({ summary: '获取我的消息列表' })
  async getMessages(@CurrentUser() user: any, @Query() query: any) {
    return this.messageService.getMessages(user.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('messages/:id/read')
  @ApiOperation({ summary: '标记消息已读' })
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messageService.markRead(Number(id), user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('messages/unread-count')
  @ApiOperation({ summary: '获取未读消息数量' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messageService.getUnreadCount(user.userId);
  }
}
