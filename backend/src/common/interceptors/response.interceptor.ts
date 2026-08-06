import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return { code: 0, message: 'success', data: null };
        }
        if (typeof data === 'object' && 'code' in data && 'data' in data) {
          return data;
        }
        return { code: 0, message: 'success', data };
      }),
    );
  }
}
