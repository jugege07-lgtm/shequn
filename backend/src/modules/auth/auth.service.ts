import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { PhonePasswordLoginDto } from './dto/phone-password-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
      where: { nickname: ADMIN_USERNAME, role: { contains: 'admin' } },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await this.prisma.user.create({
        data: {
          openid: 'admin_fixed_' + Date.now(),
          nickname: ADMIN_USERNAME,
          avatarUrl: '/uploads/logo.jpg',
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

    // 验证密码（默认管理员未设置密码时使用环境变量默认值）
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
        phone: user.phone,
        role: user.role,
        roles: String(user.role || '').split(',').map((s) => s.trim()).filter(Boolean),
        adminLevel: user.adminLevel,
      },
    };
  }

  // ========== 后台角色账号登录（编辑/审核/运营/管理员） ==========
  async staffLogin(dto: AdminLoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const username = (dto.username || '').trim();
    if (!username) throw new UnauthorizedException('请输入用户名');
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

    // 按昵称或手机号查找（后台角色账号）
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ nickname: username }, { phone: username }] },
    });

    // 兼容默认管理员首次登录
    if (!user && username === ADMIN_USERNAME) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await this.prisma.user.create({
        data: {
          openid: 'admin_fixed_' + Date.now(),
          nickname: ADMIN_USERNAME,
          avatarUrl: '/uploads/logo.jpg',
          role: 'admin',
          adminLevel: 1,
          password: hashedPassword,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('账号不存在，请先将该账号分配为后台角色');
    }

    // 校验该账号是否拥有后台角色权限
    const roles = String(user.role || '').split(',').map((s) => s.trim()).filter(Boolean);
    const hasStaffRole = roles.some((r) => ['admin', 'editor', 'moderator', 'operator'].includes(r));
    if (!hasStaffRole) {
      throw new UnauthorizedException('该账号无后台管理权限，请先由管理员分配角色');
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
        phone: user.phone,
        role: user.role,
        roles,
        adminLevel: user.adminLevel,
      },
    };
  }

  // ========== 会员注册（同步创建用户与名片） ==========
  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // 真实校验短信验证码（由 SmsService 校验内存中的下发记录）
    if (!this.smsService.verify(dto.phone, dto.code)) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 检查手机号是否已注册
    const exist = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    if (exist) {
      throw new BadRequestException('该手机号已注册');
    }

    // 校验推荐人是否存在（扫码名片注册时携带 referrerId）
    let referrer: User | null = null;
    if (dto.referrerId) {
      referrer = await this.prisma.user.findUnique({ where: { id: dto.referrerId } });
      if (!referrer) {
        throw new BadRequestException('推荐人不存在');
      }
    }

    // 默认密码策略：前端传了就用前端的（≥6位），否则使用 123456
    const rawPassword = (dto.password && dto.password.length >= 6) ? dto.password : '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        openid: `phone_${dto.phone}_${Date.now()}`,
        phone: dto.phone,
        nickname: dto.nickname || dto.realName,
        avatarUrl: dto.avatarUrl || '',
        role: 'user',
        password: hashedPassword,
        referrerId: referrer ? referrer.id : undefined,
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

    // 5. 扫码名片注册：为新用户发放扫码注册奖励，并为推荐人发放邀请奖励
    if (referrer) {
      try { await this.pointService.awardPoints(user.id, 'referral_register', '扫码名片注册奖励'); } catch {}
      try { await this.pointService.awardPoints(referrer.id, 'invite', '成功邀请新用户奖励'); } catch {}
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

  // ========== 手机号+密码登录 ==========
  async phonePasswordLogin(dto: PhonePasswordLoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
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

  // ========== 发送短信验证码 ==========
  async sendCode(phone: string) {
    // 基础校验
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    // 真实下发（生产环境由 SmsService 调用腾讯云 SMS；未配置则在控制台打印验证码用于联调）
    const result = await this.smsService.sendCode(phone);
    return {
      success: true,
      message: '验证码已发送',
      phone,
      // 仅在未配置腾讯云 SMS 的非生产环境返回，便于联调
      devCode: result.devCode,
    };
  }

  // ========== 忘记密码：校验验证码后重设密码 ==========
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    // 校验手机号用户是否存在
    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    if (!user) {
      throw new BadRequestException('该手机号未注册');
    }

    // 校验短信验证码（与注册一致，由 SmsService 校验内存中的下发记录）
    if (!this.smsService.verify(dto.phone, dto.code)) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 重设密码
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: '密码重置成功' };
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
