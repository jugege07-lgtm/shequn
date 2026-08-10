import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface RuleResult {
  ruleId: number;
  action: string;
  points: number;
  reason: string;
}

@Injectable()
export class PointService extends PrismaService {
  /** 首次启动时初始化默认积分规则（仅当规则表为空时写入，避免覆盖管理端配置） */
  async onModuleInit() {
    await super.onModuleInit();
    try {
      const count = await this.pointRule.count();
      if (count === 0) {
        const defaults = [
          { name: '注册奖励', action: 'register', points: 100, maxPerDay: 1, sortOrder: 1 },
          { name: '扫码名片注册奖励', action: 'referral_register', points: 50, maxPerDay: 1, sortOrder: 2 },
          { name: '成功邀请好友奖励', action: 'invite', points: 50, maxPerDay: 10, sortOrder: 3 },
          { name: '活动报名奖励', action: 'activity_signup', points: 20, maxPerDay: 5, sortOrder: 4 },
          { name: '发布商机奖励', action: 'publish_business', points: 20, maxPerDay: 5, sortOrder: 5 },
          { name: '解锁商机奖励', action: 'unlock_business', points: 10, maxPerDay: 10, sortOrder: 6 },
        ];
        await this.pointRule.createMany({
          data: defaults.map((r) => ({ ...r, ruleGroup: 'default', priority: 0, enabled: 1 })),
        });
        console.log('[PointService] 已初始化默认积分规则');
      }
    } catch (err) {
      console.error('[PointService] 初始化默认积分规则失败:', err);
    }
  }

  // ===== 积分规则管理 =====

  /** 获取积分规则列表（管理端） */
  async getRules(params?: { page?: number; size?: number; ruleGroup?: string; enabled?: number | string }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = {};
    if (params?.ruleGroup) where.ruleGroup = params.ruleGroup;
    if (params?.enabled !== undefined && params.enabled !== '') {
      where.enabled = Number(params.enabled);
    }

    const [list, total] = await Promise.all([
      this.pointRule.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
      }),
      this.pointRule.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 获取所有规则（不分页，用于前端下拉选择） */
  async getAllRules() {
    return this.pointRule.findMany({
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  /** 创建规则 */
  async createRule(data: any) {
    return this.pointRule.create({
      data: {
        name: data.name || '',
        action: data.action || '',
        ruleGroup: data.ruleGroup || 'default',
        priority: Number(data.priority) || 0,
        points: Number(data.points) || 0,
        maxPerDay: Number(data.maxPerDay) || 1,
        enabled: Number(data.enabled) || 1,
        sortOrder: Number(data.sortOrder) || 0,
      },
    });
  }

  /** 更新规则 */
  async updateRule(id: number, data: any) {
    const payload: any = { ...data };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    if (payload.priority !== undefined) payload.priority = Number(payload.priority);
    if (payload.points !== undefined) payload.points = Number(payload.points);
    if (payload.maxPerDay !== undefined) payload.maxPerDay = Number(payload.maxPerDay);
    if (payload.enabled !== undefined) payload.enabled = Number(payload.enabled);
    if (payload.sortOrder !== undefined) payload.sortOrder = Number(payload.sortOrder);
    return this.pointRule.update({ where: { id }, data: payload });
  }

  /** 删除规则 */
  async deleteRule(id: number) {
    return this.pointRule.delete({ where: { id } });
  }

  /** 批量更新排序（拖拽排序） */
  async updateSortOrders(updates: { id: number; sortOrder: number }[]) {
    const transactions = updates.map((u) =>
      this.pointRule.update({
        where: { id: u.id },
        data: { sortOrder: u.sortOrder },
      }),
    );
    return this.$transaction(transactions);
  }

  /** 批量更新优先级（拖拽排序） */
  async updatePriorities(updates: { id: number; priority: number }[]) {
    const transactions = updates.map((u) =>
      this.pointRule.update({
        where: { id: u.id },
        data: { priority: u.priority },
      }),
    );
    return this.$transaction(transactions);
  }

  // ===== 积分发放引擎（多规则并行） =====

  /**
   * 多规则并行积分引擎
   * 根据 action 查找所有启用的规则，按优先级从高到低逐个判断，
   * 满足条件的规则独立触发积分发放，互不干扰，积分累加。
   */
  async awardPointsParallel(userId: number, action: string, remark: string): Promise<RuleResult[]> {
    // 1. 查找该 action 下所有启用的规则，按优先级降序排列
    const rules = await this.pointRule.findMany({
      where: { action, enabled: 1 },
      orderBy: { priority: 'desc' },
    });

    if (rules.length === 0) return [];

    const results: RuleResult[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. 逐条规则并行判断（串行遍历，因为需要同步更新用户积分）
    for (const rule of rules) {
      // 检查今日已发放次数
      const todayCount = await this.pointLog.count({
        where: {
          userId,
          action: rule.action,
          points: { gt: 0 },
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayCount >= rule.maxPerDay) {
        // 达到每日上限，跳过该规则
        continue;
      }

      // 获取用户当前积分
      const user = await this.user.findUnique({ where: { id: userId } });
      const currentPoints = user?.points ?? 0;
      const newBalance = currentPoints + rule.points;

      // 3. 更新用户积分
      await this.user.update({
        where: { id: userId },
        data: { points: newBalance },
      });

      // 4. 记录日志（包含规则名称和分组信息）
      await this.pointLog.create({
        data: {
          userId,
          action: rule.action,
          points: rule.points,
          balance: newBalance,
          remark: remark || `${rule.name}(${rule.ruleGroup})`,
        },
      });

      results.push({
        ruleId: rule.id,
        action: rule.action,
        points: rule.points,
        reason: `${rule.name} [${rule.ruleGroup}] 获得 ${rule.points} 积分`,
      });
    }

    return results;
  }

  /**
   * 便捷方法：根据 action 发放积分（内部调用并行引擎）
   */
  async awardPoints(userId: number, action: string, remark?: string) {
    return this.awardPointsParallel(userId, action, remark || action);
  }

  // ===== 用户积分查询 =====

  /** 获取用户积分 */
  async getUserPoints(userId: number) {
    const user = await this.user.findUnique({ where: { id: userId } });
    return { points: user?.points ?? 0 };
  }

  /** 获取用户积分明细 */
  async getUserPointLogs(userId: number, params?: { page?: number; size?: number }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const [list, total] = await Promise.all([
      this.pointLog.findMany({
        where: { userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.pointLog.count({ where: { userId } }),
    ]);
    return { list, total, page, size };
  }

  /** 获取所有积分明细（管理端） */
  async getAllPointLogs(params?: { page?: number; size?: number; userId?: number | string; keyword?: string; action?: string; startDate?: string; endDate?: string }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = {};
    if (params?.userId) where.userId = Number(params.userId);
    if (params?.action) where.action = params.action;
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }
    if (params?.keyword) {
      where.user = {
        OR: [
          { nickname: { contains: params.keyword } },
          { phone: { contains: params.keyword } },
        ],
      };
    }

    const [list, total] = await Promise.all([
      this.pointLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, nickname: true, phone: true, avatarUrl: true } } },
      }),
      this.pointLog.count({ where }),
    ]);
    return { list, total, page, size };
  }

  // ===== 积分调整 =====

  /**
   * 消耗积分（内部调用，通常用于购物/兑换等业务场景）
   * @param userId 用户ID
   * @param points 消耗积分（正数）
   * @param action 业务动作标识（写入 point_logs.action，如 product_exchange）
   * @param remark 备注说明
   * 返回变动后余额。积分不足会抛 BadRequestException。
   */
  async spendPoints(userId: number, points: number, action: string, remark: string) {
    const uid = Number(userId);
    const need = Math.max(0, Math.floor(Number(points) || 0));
    if (need <= 0) throw new Error('消耗积分必须大于 0');
    const user = await this.user.findUnique({ where: { id: uid } });
    if (!user) throw new Error('用户不存在');
    const current = user.points ?? 0;
    if (current < need) {
      throw new Error(`积分不足，当前 ${current} 积分`);
    }
    const newBalance = current - need;
    await this.user.update({
      where: { id: uid },
      data: { points: newBalance },
    });
    await this.pointLog.create({
      data: {
        userId: uid,
        action,
        points: -need,
        balance: newBalance,
        remark,
      },
    });
    return { userId: uid, points: newBalance, spent: need };
  }

  /** 消耗积分（手动调整） */
  async adjustPoints(userId: number, points: number, remark: string) {
    const uid = Number(userId);
    const delta = Number(points);
    if (!uid || isNaN(delta)) {
      throw new Error('参数错误：用户ID和积分值必须有效');
    }
    const user = await this.user.findUnique({ where: { id: uid } });
    if (!user) throw new Error('用户不存在');
    const newBalance = (user.points ?? 0) + delta;
    if (newBalance < 0) throw new Error('积分不足');

    await this.user.update({
      where: { id: uid },
      data: { points: newBalance },
    });

    await this.pointLog.create({
      data: {
        userId: uid,
        action: 'adjust',
        points: delta,
        balance: newBalance,
        remark: remark || '管理员手动调整',
      },
    });

    return { userId: uid, points: newBalance };
  }
}
