import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContentModeration } from '../../common/moderation/content-moderation.decorator';
import { ContentModerationGuard } from '../../common/moderation/content-moderation.guard';

@ApiTags('名片')
@Controller('api')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  /** 公开接口：获取名片详情 */
  @Get('public/cards/:id')
  @ApiOperation({ summary: '公开名片详情（无需登录）' })
  async getPublicCard(@Param('id') id: string) {
    return await this.cardService.getPublicCard(Number(id));
  }

  /** 私有接口：获取我的名片 */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('cards/me')
  @ApiOperation({ summary: '获取我的名片' })
  async getMyCard(@CurrentUser() user: any) {
    return await this.cardService.getMyCard(user.userId);
  }

  /** 私有接口：创建/更新名片 */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ContentModerationGuard)
  @ContentModeration('realName', 'company', 'position', 'wechat', 'intro', 'tags', 'socialLinks')
  @Put('cards/me')
  @ApiOperation({ summary: '创建/编辑名片' })
  async updateCard(
    @CurrentUser() user: any,
    @Body() dto: Record<string, any>,
  ) {
    return await this.cardService.updateCard(user.userId, dto);
  }

  /** 私有接口：获取名片二维码（Base64 PNG） */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('cards/me/qrcode')
  @ApiOperation({ summary: '获取名片二维码' })
  async getQrcode(@CurrentUser() user: any) {
    const card = await this.cardService.getMyCard(user.userId);
    const qrcodeBase64 = await this.cardService.getQrcodeBase64(Number(card.id));
    return {
      qrcodeBase64,
      shareUrl: `https://www.jugekeji.com/h5/card/share/${card.id}`,
    };
  }

  /** 公开接口：获取名片分享数据（含二维码） */
  @Get('public/cards/:id/share')
  @ApiOperation({ summary: '获取名片分享数据' })
  async getShareCard(@Param('id') id: string) {
    const card = await this.cardService.getPublicCard(Number(id));
    const qrcodeBase64 = await this.cardService.getQrcodeBase64(Number(card.id));
    return {
      ...card,
      qrcodeBase64,
      shareUrl: `https://www.jugekeji.com/h5/card/share/${card.id}`,
    };
  }
}
