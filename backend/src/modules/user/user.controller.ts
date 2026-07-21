import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AddressService } from './address.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly addressService: AddressService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@CurrentUser() user: any) {
    const userId = Number(user.userId);
    const u = await this.userService.findById(Number(userId));
    if (!u) return { code: 0, data: null };
    const { phone, ...rest } = u;
    const [activityCount, businessCount, couponCount] = await Promise.all([
      this.userService.getActivityCount(userId),
      this.userService.getBusinessCount(userId),
      this.userService.getCouponCount(userId),
    ]);
    return {
      code: 0,
      data: {
        ...rest,
        phone: phone ? '***' : '',
        activityCount,
        businessCount,
        couponCount,
      },
    };
  }

  @Put('profile')
  @ApiOperation({ summary: '更新用户资料' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = Number(user.userId);
    const updated = await this.userService.updateProfile(Number(userId), dto);
    const { phone, ...rest } = updated;
    return {
      code: 0,
      data: {
        ...rest,
        phone: phone ? '***' : '',
      },
    };
  }

  @Get('addresses')
  @ApiOperation({ summary: '收货地址列表' })
  async getAddresses(@CurrentUser() user: any) {
    return { code: 0, data: await this.addressService.getAddresses(Number(user.userId)) };
  }

  @Post('addresses')
  @ApiOperation({ summary: '新增收货地址' })
  async createAddress(@CurrentUser() user: any, @Body() dto: AddressDto) {
    return { code: 0, data: await this.addressService.createAddress(Number(user.userId), dto) };
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: '更新收货地址' })
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddressDto,
  ) {
    return { code: 0, data: await this.addressService.updateAddress(Number(user.userId), Number(id), dto) };
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: '删除收货地址' })
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.addressService.deleteAddress(Number(user.userId), Number(id)) };
  }

  @Put('addresses/:id/default')
  @ApiOperation({ summary: '设为默认地址' })
  async setDefaultAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return { code: 0, data: await this.addressService.setDefault(Number(user.userId), Number(id)) };
  }
}
