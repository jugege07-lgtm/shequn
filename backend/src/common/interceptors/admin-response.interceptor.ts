import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminResponseInterceptor implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        return originalJson(body);
      }

      const wrapped = {
        code: 0,
        data: body,
        message: 'success',
      };
      return originalJson(wrapped);
    };

    next();
  }
}
