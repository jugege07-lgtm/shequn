import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error('HttpExceptionFilter caught:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errors: string[] | null = null;
    // 敏感词审核命中标记：前端据此弹「内容违规」提示框（区别于普通 400 toast）
    let moderation = false;
    let moderationField: string | null = null;
    let keywords: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = (res as any).message || message;
        errors = (res as any).errors || null;
        moderation = (res as any).moderation === true;
        moderationField = (res as any).field || null;
        keywords = (res as any).keywords || null;
      }
    }

    const payload: Record<string, any> = {
      code: status,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
    if (moderation) {
      payload.moderation = true;
      payload.field = moderationField || '';
      payload.keywords = keywords || [];
    }
    response.status(status).json(payload);
  }
}
