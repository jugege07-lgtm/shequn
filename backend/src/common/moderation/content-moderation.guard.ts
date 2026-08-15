import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TextModerationService } from './text-moderation.service';
import { ContentModerationException } from './content-moderation.exception';
import { CONTENT_MODERATION_KEY } from './content-moderation.decorator';

/**
 * 敏感词审核 Guard：读取 @ContentModeration 声明的字段，逐字段送腾讯云 TMS 审核。
 * 命中违规词 → 抛 ContentModerationException（400 + moderation 标记），
 * 请求不会进入业务 Service，不写库、不进后续流程。
 * 服务端强制校验，绕过前端直接调接口同样被拦截。
 */
@Injectable()
export class ContentModerationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moderation: TextModerationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const fields = this.reflector.getAllAndOverride<string[]>(CONTENT_MODERATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!fields || !fields.length) return true;

    const req = context.switchToHttp().getRequest();
    const body = req.body || {};
    const toCheck: Record<string, any> = {};
    for (const f of fields) {
      if (body[f] !== undefined && body[f] !== null && body[f] !== '') {
        toCheck[f] = body[f];
      }
    }
    if (!Object.keys(toCheck).length) return true;

    const hit = await this.moderation.checkFields(toCheck);
    if (hit) {
      throw new ContentModerationException(hit.field, hit.keywords);
    }
    return true;
  }
}
