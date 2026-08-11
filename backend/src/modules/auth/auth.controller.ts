import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { PhonePasswordLoginDto } from './dto/phone-password-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('认证')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat-login')
  @HttpCode(200)
  @ApiOperation({ summary: '微信登录（小程序）' })
  @ApiBody({ type: LoginDto })
  async wechatLogin(@Body() dto: LoginDto) {
    return await this.authService.wechatLogin(dto);
  }

  @Post('phone-login')
  @HttpCode(200)
  @ApiOperation({ summary: '手机号登录（小程序）' })
  @ApiBody({ type: LoginDto })
  async phoneLogin(@Body() dto: LoginDto) {
    return await this.authService.phoneLogin(dto);
  }

  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: '会员注册（同步创建用户与名片）' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('admin-login')
  @HttpCode(200)
  @ApiOperation({ summary: '管理员登录（后台）' })
  @ApiBody({ type: AdminLoginDto })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return await this.authService.adminLogin(dto);
  }

  @Post('staff-login')
  @HttpCode(200)
  @ApiOperation({ summary: '后台角色账号登录（编辑/审核/运营/管理员）' })
  @ApiBody({ type: AdminLoginDto })
  async staffLogin(@Body() dto: AdminLoginDto) {
    return await this.authService.staffLogin(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '刷新 Token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('phone-password-login')
  @HttpCode(200)
  @ApiOperation({ summary: '手机号+密码登录' })
  @ApiBody({ type: PhonePasswordLoginDto })
  async phonePasswordLogin(@Body() dto: PhonePasswordLoginDto) {
    return await this.authService.phonePasswordLogin(dto);
  }

  @Post('send-code')
  @HttpCode(200)
  @ApiOperation({ summary: '发送手机验证码（演示/mock）' })
  async sendCode(@Body('phone') phone: string) {
    return await this.authService.sendCode(phone);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: '忘记密码：校验验证码后重设密码' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto);
  }
}
