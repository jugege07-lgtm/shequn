import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { PhonePasswordLoginDto } from './dto/phone-password-login.dto';
import { User } from '@prisma/client';
import { PointService } from '../point/point.service';
import { SmsService } from '../sms/sms.service';

const WX_LOGIN_URL = 'https://api.weixin.qq.com/sns/jscode2session';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private prisma: PrismaService,
    private pointService: PointService,
    private smsService: SmsService,
  ) {}

  // ========== Admin 登录 ==========
  async adminLogin(dto: AdminLoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

    let user = await this.prisma.user.findFirst({
      where: { nickname: ADMIN_USERNAME, role: 'admin' },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await this.prisma.user.create({
        data: {
          openid: 'admin_fixed_' + Date.now(),
          nickname: ADMIN_USERNAME,
          avatarUrl: '',
          role: 'admin',
          adminLevel: 1,
          password: hashedPassword,
        },
      });
    } else if (!user.nickname || user.nickname === '???' || user.nickname.includes('?')) {
      // 历史数据占位符修正
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { nickname: ADMIN_USERNAME },
      });
    }

    const passwordToCheck = user.password || ADMIN_PASSWORD;
    const passwordMatch = await bcrypt.compare(dto.password, passwordToCheck);
    if (!passwordMatch) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = this.generateJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        adminLevel: user.adminLevel,
      },
    };
  }

  // ========== 会员注册（同步创建用户与名片） ==========
  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // 真实校验验证码（与发送时的 scene 一致：注册场景用 'register'）
    const verified = this.smsService.verify(dto.phone, dto.code, 'register');
    if (!verified) {
      throw new BadRequestException('验证码错误或已失效，请重新获取');
    }

    // 检查手机号是否已注册（手机号在数据库中是 AES 加密存储的）
    const encryptedPhone = this.userService.encryptPhone(dto.phone);
    const exist = await this.prisma.user.findFirst({ where: { phone: encryptedPhone } });
    if (exist) {
      throw new BadRequestException('该手机号已注册');
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await this.prisma.user.create({
      data: {
        openid: `phone_${dto.phone}_${Date.now()}`,
        phone: encryptedPhone,
        nickname: dto.nickname || dto.realName,
        avatarUrl: dto.avatarUrl || '',
        role: 'user',
        password: hashedPassword,
        card: {
          create: {
            realName: dto.realName,
            company: dto.company || '',
            position: dto.position || '',
            wechat: dto.wechat || '',
            avatarUrl: dto.avatarUrl || '',
            intro: dto.intro || '',
          },
        },
      },
      include: { card: true },
    });

    // 4. 发放注册积分
    try { await this.pointService.awardPoints(user.id, 'register', '注册奖励'); } catch {}

    const payload = this.generateJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  // ========== 手机号+密码登录 ==========
  async phonePasswordLogin(dto: PhonePasswordLoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // 手机号在数据库中是 AES 加密存储的，需要加密后查询
    const encryptedPhone = this.userService.encryptPhone(dto.phone);
    const user = await this.prisma.user.findFirst({ where: { phone: encryptedPhone } });
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password || '');
    if (!passwordMatch) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const payload = this.generateJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  // ========== 发送验证码（委托 SmsService，真实下发） ==========
  async sendCode(phone: string, scene: 'login' | 'register' | 'reset_password' | 'bind_phone' = 'login') {
    const result = await this.smsService.sendCode(phone, scene);
    return { success: true, message: result.message, phone, scene };
  }

  // ========== 微信登录 ==========
  async wechatLogin(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const wxResult = await this.wxCode2Session(dto.code);

    let user = await this.userService.findByOpenid(wxResult.openid);
    let isNewUser = false;
    if (!user) {
      user = await this.userService.createOrUpdate(wxResult.openid, {
        nickname: '',
        avatarUrl: '',
        unionId: wxResult.unionid || undefined,
      });
      isNewUser = true;
      this.logger.log(`New user created: openid=${wxResult.openid}, id=${user.id}`);
    } else {
      await this.userService.createOrUpdate(wxResult.openid, {
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      });
    }

    // 新用户微信登录首次注册触发积分规则
    if (isNewUser) {
      try { await this.pointService.awardPoints(user.id, 'register', '微信注册奖励'); } catch {}
    }

    const payload = this.generateJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async phoneLogin(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const wxResult = await this.wxCode2Session(dto.code);
    const phone = '13800138000'; // TODO: 解密手机号

    let user = await this.userService.findByOpenid(wxResult.openid);
    if (!user) {
      user = await this.userService.createOrUpdate(wxResult.openid, { phone });
    } else {
      await this.userService.createOrUpdate(wxResult.openid, { phone });
    }

    const payload = this.generateJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        openid: payload.openid,
        role: payload.role,
        adminLevel: payload.adminLevel,
        vipLevel: payload.vipLevel,
      });
      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Refresh token 无效');
    }
  }

  generateJwtPayload(user: User) {
    return {
      sub: Number(user.id),
      openid: user.openid,
      role: user.role,
      adminLevel: user.adminLevel,
      vipLevel: user.vipLevel,
    };
  }

  private async wxCode2Session(code: string): Promise<{ openid: string; session_key: string; unionid?: string }> {
    const appId = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;

    if (!appId || !secret) {
      this.logger.warn('微信配置缺失，使用 mock 登录');
      return {
        openid: `mock_openid_${Date.now()}`,
        session_key: 'mock_session_key',
      };
    }

    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(WX_LOGIN_URL, {
        params: { appid: appId, secret, js_code: code, grant_type: 'authorization_code' },
      });
      if (res.data.errcode) {
        throw new Error(`微信登录失败: ${res.data.errmsg}`);
      }
      return {
        openid: res.data.openid,
        session_key: res.data.session_key,
        unionid: res.data.unionid || undefined,
      };
    } catch (err: any) {
      this.logger.error('微信登录接口调用失败', err.message);
      return {
        openid: `mock_openid_${Date.now()}`,
        session_key: 'mock_session_key',
      };
    }
  }
}
