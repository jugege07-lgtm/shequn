import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserService } from '../user/user.service';

const CONFIG_MIN_VIP_LEVEL = 'dajia_min_vip_level';

@Injectable()
export class ConnectionService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  /** 读取"大咖人脉"所需最低 VIP 级别（管理端可配置，默认 1 级） */
  async getMinVipLevel(): Promise<number> {
    const cfg = await this.prisma.systemConfig.findUnique({ where: { key: CONFIG_MIN_VIP_LEVEL } });
    const level = cfg ? Number(cfg.value) : 1;
    return Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  }

  /** 判断用户是否为有效 VIP（等级达标且未过期；未设置过期时间视为有效） */
  private isVip(user: any, minLevel: number): boolean {
    if (!user || user.vipLevel < minLevel) return false;
    if (user.vipExpireAt && new Date(user.vipExpireAt).getTime() < Date.now()) return false;
    return true;
  }

  /**
   * 校验当前用户 VIP 权限，不通过则抛 403。
   * 注意：必须从数据库读取最新用户记录，而不是信任 JWT 里的 vipLevel——用户升级 VIP 后令牌可能仍是旧值，否则会误判为 403。
   */
  private async assertVip(userId: number): Promise<number> {
    const minLevel = await this.getMinVipLevel();
    const fresh = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!this.isVip(fresh, minLevel)) {
      throw new ForbiddenException(`该功能需要 VIP${minLevel} 及以上会员权限`);
    }
    return minLevel;
  }

  /** 获取大咖人脉功能配置（公开，用于前端做 VIP 提示） */
  async getDajiaConfig() {
    const minLevel = await this.getMinVipLevel();
    return { minVipLevel: minLevel, feature: '大咖人脉' };
  }

  /** 脱敏联系方式：非已同意好友只展示脱敏或隐藏 */
  private maskPhone(encrypted: string | null, unlocked: boolean): string {
    if (!encrypted) return '';
    const phone = this.userService.decryptPhone(encrypted);
    if (!phone) return '';
    if (unlocked) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  /** 大咖推荐列表（需 VIP） */
  async getRecommendations(userId: number) {
    await this.assertVip(userId);
    const now = Date.now();

    // 大咖 = 拥有完整名片信息的用户，且非当前用户
    const dajia = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        card: { isNot: null },
      },
      include: {
        card: true,
      },
      orderBy: [{ vipLevel: 'desc' }, { createdAt: 'asc' }],
      take: 50,
    });

    // 批量查询当前用户与这些大咖已有的联系状态
    const targetIds = dajia.map((d) => d.id);
    const existing = targetIds.length
      ? await this.prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: userId, targetId: { in: targetIds } },
              { requesterId: { in: targetIds }, targetId: userId },
            ],
          },
        })
      : [];

    const statusMap = new Map<number, { status: string; connectionId: number }>();
    existing.forEach((c) => {
      const otherId = c.requesterId === userId ? c.targetId : c.requesterId;
      statusMap.set(otherId, { status: c.status, connectionId: c.id });
    });

    const list = dajia.map((d) => {
      const rel = statusMap.get(d.id);
      const accepted = rel?.status === 'accepted';
      return {
        id: d.id,
        nickname: d.nickname,
        avatarUrl: d.avatarUrl,
        vipLevel: d.vipLevel,
        realName: d.card?.realName || '',
        company: d.card?.company || '',
        position: d.card?.position || '',
        intro: d.card?.intro || '',
        viewCount: d.card?.viewCount || 0,
        // 只有"已同意"才展示完整电话，否则脱敏
        phone: this.maskPhone(d.phone, accepted),
        status: rel ? this.normalizeStatus(rel.status) : 'none',
        connectionId: rel?.connectionId || null,
      };
    });

    return { list, minVipLevel: await this.getMinVipLevel() };
  }

  private normalizeStatus(status: string): string {
    if (status === 'accepted') return 'accepted';
    if (status === 'rejected') return 'rejected';
    if (status === 'pending') {
      // 区分"我发出的等待确认"与"对方发给我的待处理"
      return 'requested';
    }
    return 'none';
  }

  /** 发起联系请求（需 VIP）。向被联系人发送待确认消息通知 */
  async requestConnection(userId: number, targetId: number) {
    await this.assertVip(userId);
    if (userId === targetId) throw new BadRequestException('不能添加自己为人脉');

    const [target, requester] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetId },
        include: { card: true },
      }),
      // 需查询完整的请求方信息，用于构造消息中的真实姓名（JWT 里只有 userId）
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { card: true },
      }),
    ]);
    if (!target) throw new NotFoundException('该用户不存在');
    if (!requester) throw new NotFoundException('当前用户不存在');

    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, targetId },
          { requesterId: targetId, targetId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') throw new BadRequestException('你们已是好友人脉');
      if (existing.status === 'pending') throw new BadRequestException('已发送过联系请求，请等待对方确认');
      if (existing.status === 'rejected') {
        // 被拒绝后可重新发起，更新状态为 pending
        await this.prisma.connection.update({
          where: { id: existing.id },
          data: { status: 'pending' },
        });
        await this.notifyRequest(target, requester, existing.id);
        return { connectionId: existing.id, status: 'pending' };
      }
    }

    const connection = await this.prisma.connection.create({
      data: { requesterId: userId, targetId, status: 'pending' },
    });
    await this.notifyRequest(target, requester, connection.id);
    return { connectionId: connection.id, status: 'pending' };
  }

  /** 向被联系人发送"有人请求添加你为人脉"的消息 */
  private async notifyRequest(target: any, requester: any, connectionId: number) {
    const requesterName = requester.nickname || requester.card?.realName || `用户${requester.id}`;
    await this.prisma.message.create({
      data: {
        userId: target.id,
        type: 'connection_request',
        title: '新的人脉申请',
        content: `${requesterName} 请求添加你为好友人脉，请确认是否同意`,
        data: JSON.stringify({
          connectionId,
          sourceUserId: requester.id,
          sourceName: requesterName,
          feature: '大咖人脉',
        }),
      },
    });
  }

  /** 我确认他人发来的联系请求（同意/拒绝） */
  async respond(userId: number, connectionId: number, accept: boolean) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: { requester: { include: { card: true } }, target: true },
    });
    if (!connection) throw new NotFoundException('人脉申请不存在');
    if (connection.targetId !== userId) throw new ForbiddenException('无权处理该申请');
    if (connection.status !== 'pending') throw new BadRequestException('该申请已处理');

    await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: accept ? 'accepted' : 'rejected' },
    });

    // 通知请求方处理结果
    const targetName = connection.target.nickname || `用户${userId}`;
    const data = { connectionId, accepted: accept, feature: '大咖人脉' };
    if (accept) {
      // 同意：将完整电话号码告知请求方
      const fullPhone = this.maskPhone(connection.target.phone, true);
      await this.prisma.message.create({
        data: {
          userId: connection.requesterId,
          type: 'connection_response',
          title: '人脉申请已通过',
          content: `${targetName} 已同意添加你为人脉，联系方式：${fullPhone || '未填写'}`,
          data: JSON.stringify({ ...data, phone: fullPhone }),
        },
      });
    } else {
      await this.prisma.message.create({
        data: {
          userId: connection.requesterId,
          type: 'connection_response',
          title: '人脉申请被拒绝',
          content: `${targetName} 拒绝了你的好友人脉申请`,
          data: JSON.stringify(data),
        },
      });
    }

    return { connectionId, status: accept ? 'accepted' : 'rejected' };
  }

  /** 我收到的待确认人脉申请 */
  async getRequests(userId: number) {
    const list = await this.prisma.connection.findMany({
      where: { targetId: userId, status: 'pending' },
      include: {
        requester: {
          include: { card: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((c) => ({
      connectionId: c.id,
      requesterId: c.requesterId,
      nickname: c.requester.nickname || '',
      avatarUrl: c.requester.avatarUrl || '',
      realName: c.requester.card?.realName || '',
      company: c.requester.card?.company || '',
      position: c.requester.card?.position || '',
      createdAt: c.createdAt,
    }));
  }

  /** 我的人脉（已同意的双向关系） */
  async getMyConnections(userId: number) {
    const list = await this.prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { targetId: userId }],
      },
      include: {
        requester: { include: { card: true } },
        target: { include: { card: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return list.map((c) => {
      const isRequester = c.requesterId === userId;
      const other = isRequester ? c.target : c.requester;
      return {
        connectionId: c.id,
        userId: other.id,
        cardId: other.card?.id || null,
        nickname: other.nickname || '',
        // 头像：优先用户头像，其次名片头像
        avatarUrl: other.avatarUrl || other.card?.avatarUrl || '',
        realName: other.card?.realName || '',
        company: other.card?.company || '',
        position: other.card?.position || '',
        email: other.card?.email || '',
        // 已同意 → 展示完整电话
        phone: this.maskPhone(other.phone, true),
        createdAt: c.createdAt,
      };
    });
  }

  /** 获取已同意好友的完整名片（好友间可见完整联系方式） */
  async getFriendCard(userId: number, friendId: number) {
    const conn = await this.prisma.connection.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, targetId: friendId },
          { requesterId: friendId, targetId: userId },
        ],
      },
      include: {
        requester: { include: { card: true } },
        target: { include: { card: true } },
      },
    });
    if (!conn) throw new NotFoundException('你们还不是好友人脉');

    const isRequester = conn.requesterId === userId;
    const other = isRequester ? conn.target : conn.requester;
    return {
      connectionId: conn.id,
      userId: other.id,
      cardId: other.card?.id || null,
      nickname: other.nickname || '',
      avatarUrl: other.avatarUrl || other.card?.avatarUrl || '',
      realName: other.card?.realName || '',
      company: other.card?.company || '',
      position: other.card?.position || '',
      wechat: other.card?.wechat || '',
      email: other.card?.email || '',
      intro: other.card?.intro || '',
      // 已同意 → 展示完整电话，便于一键保存通讯录
      phone: this.maskPhone(other.phone, true),
    };
  }
}