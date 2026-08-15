import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContentModeration } from '../../common/moderation/content-moderation.decorator';
import { ContentModerationGuard } from '../../common/moderation/content-moderation.guard';

@ApiTags('商城')
@Controller('api')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('public/product-categories')
  @ApiOperation({ summary: '获取商品分类（公开）' })
  async getPublicCategories() {
    return { code: 0, data: await this.productService.getPublicCategories() };
  }

  @Get('public/products')
  @ApiOperation({ summary: '获取商品列表（公开）' })
  async getPublicProducts(@Query() query: any) {
    return { code: 0, data: await this.productService.getPublicProducts(query) };
  }

  @Get('public/products/:id')
  @ApiOperation({ summary: '获取商品详情（公开）' })
  async getProduct(@Param('id') id: string) {
    return { code: 0, data: await this.productService.getProduct(Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ContentModerationGuard)
  @ContentModeration('remark')
  @Post('orders')
  @ApiOperation({ summary: '创建订单（立即购买）' })
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return { code: 0, data: await this.productService.createOrder(dto, Number(user.userId)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ContentModerationGuard)
  @ContentModeration('remark')
  @Post('orders/from-cart')
  @ApiOperation({ summary: '购物车结算创建订单' })
  async createOrderFromCart(@Body() dto: CreateOrderFromCartDto, @CurrentUser() user: any) {
    return { code: 0, data: await this.productService.createOrderFromCart(dto, Number(user.userId)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders/my')
  @ApiOperation({ summary: '获取我的订单' })
  async getMyOrders(@CurrentUser() user: any, @Query() query: any) {
    return { code: 0, data: await this.productService.getMyOrders(Number(user.userId), query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  @ApiOperation({ summary: '订单详情' })
  async getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.productService.getOrder(Number(user.userId), Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('orders/:id/pay')
  @ApiOperation({ summary: '支付订单（模拟支付成功）' })
  async payOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.productService.payOrder(Number(user.userId), Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('orders/:id/complete')
  @ApiOperation({ summary: '确认收货' })
  async completeOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.productService.completeOrder(Number(user.userId), Number(id)) };
  }
}
