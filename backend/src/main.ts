import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './common/prisma/prisma.service';

// class-validator 默认提示 → 中文提示 的映射
const VALIDATION_MESSAGE_ZH: Record<string, string> = {
  isNotEmpty: '不能为空',
  isString: '必须为字符串',
  isNumber: '必须为数字',
  isInt: '必须为整数',
  isDateString: '不是有效的时间格式',
  isBoolean: '必须为布尔值',
  isArray: '必须为数组',
  isEnum: '取值不合法',
  isEmail: '邮箱格式不正确',
  isPhone: '手机号格式不正确',
  min: '数值过小',
  max: '数值过大',
  minLength: '长度不足',
  maxLength: '长度超限',
  isOptional: '不能为可选',
  isDefined: '不能为空',
  isObject: '必须为对象',
  isNumberString: '必须为数字',
  isUrl: '不是有效的网址',
};

function toChineseValidationMessage(errors: ValidationError[]): string {
  const first = errors[0];
  if (!first) return '参数校验失败';
  const constraints = first.constraints || {};
  const key = Object.keys(constraints)[0];
  const zh = VALIDATION_MESSAGE_ZH[key] || '格式不正确';
  return `${first.property}${zh}`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = parseInt(process.env.PORT || '3000', 10) || 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  const uploadPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  // 静态文件也要返回 CORS 头，否则 Capacitor 原生 App（origin 为 https://localhost）跨域加载
  // /api/uploads/ 下的图片时会被浏览器拦截，导致分享海报等封面图加载失败
  // 注意：express.static 的 setHeaders 回调签名为 (res, path, stat)，必须按此顺序接收，
  //       否则 res 会拿到 path（字符串），调用 res.setHeader 将抛 "res.setHeader is not a function" 崩溃
  const staticCors = (res: any, _path: string, _stat: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Disposition', 'inline');
  };
  app.use('/uploads', express.static(uploadPath, { maxAge: '1d', setHeaders: staticCors, index: false, dotfiles: 'deny' }));
  app.use('/api/uploads', express.static(uploadPath, { maxAge: '1d', setHeaders: staticCors, index: false, dotfiles: 'deny' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      // 将 class-validator 默认英文提示转换为中文，避免用户看到英文错误
      exceptionFactory: (errors) => new BadRequestException(toChineseValidationMessage(errors)),
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new OperationLogInterceptor(app.get(PrismaService)));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use((_req: any, res: any, next: any) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*;"
    );
    next();
  });

  app.enableCors({
    // 包含 Capacitor 原生 App WebView 来源（androidScheme: https → https://localhost），否则原生 App 登录等请求会被 CORS 拦截报 Network Error
    origin: ['http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:3002', 'http://localhost:3003', 'https://admin.yourdomain.com', 'https://localhost', 'capacitor://localhost'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('社群资源对接名片 API')
    .setDescription('NestJS RESTful API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`\n========================================`);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`========================================\n`);
}
bootstrap();
