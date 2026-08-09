import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  saveFile(file: Express.Multer.File): { url: string; originalName: string } {
    const ext = path.extname(file.originalname) || '';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    // 返回相对路径 /uploads/xxx，由前端各端统一补全为 /api/uploads/xxx
    // （生产环境经 Caddy 将 /api/uploads 转发到后端静态服务，避免硬编码 localhost 导致图片损坏）
    return {
      url: `/uploads/${filename}`,
      originalName: file.originalname,
    };
  }
}
