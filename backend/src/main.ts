import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = parseInt(process.env.PORT || '3000', 10) || 3000;

  const uploadPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadPath, { maxAge: '1d' }));
  app.use('/api/uploads', express.static(uploadPath, { maxAge: '1d' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use((_req: any, res: any, next: any) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*;"
    );
    next();
  });

  app.enableCors({
    origin: ['http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:3002', 'http://localhost:3003', 'https://admin.yourdomain.com'],
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
