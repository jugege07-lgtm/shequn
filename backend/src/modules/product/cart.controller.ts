import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartDto } from './dto/add-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('购物车')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '我的购物车' })
  async getCart(@CurrentUser() user: any) {
    return { code: 0, data: await this.cartService.getCart(Number(user.userId)) };
  }

  @Post()
  @ApiOperation({ summary: '加入购物车' })
  async add(@CurrentUser() user: any, @Body() dto: AddCartDto) {
    return { code: 0, data: await this.cartService.addToCart(Number(user.userId), dto.productId, dto.quantity || 1, dto.specs) };
  }

  @Put(':id')
  @ApiOperation({ summary: '修改购物车商品数量' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartDto,
  ) {
    return { code: 0, data: await this.cartService.updateQuantity(Number(user.userId), Number(id), dto.quantity) };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除购物车商品' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.cartService.remove(Number(user.userId), Number(id)) };
  }

  @Delete('clear/all')
  @ApiOperation({ summary: '清空购物车' })
  async clear(@CurrentUser() user: any) {
    await this.cartService.clear(Number(user.userId));
    return { code: 0, data: { success: true } };
  }
}
