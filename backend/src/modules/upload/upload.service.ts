import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    // 上传文件对外访问的基础 URL：生产环境配置为真实域名，开发环境默认本机后端地址
    this.baseUrl = (process.env.UPLOAD_BASE_URL || '').replace(/\/$/, '') || `http://localhost:${process.env.PORT || 3000}`;
  }

  saveFile(file: Express.Multer.File): { url: string; originalName: string } {
    const ext = path.extname(file.originalname) || '';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    // 返回完整可访问 URL，确保富文本编辑器、移动端 H5/小程序 web-view 都能直接显示
    return {
      url: `${this.baseUrl}/uploads/${filename}`,
      originalName: file.originalname,
    };
  }
}
