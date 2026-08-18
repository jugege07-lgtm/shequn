import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import sharp, { type Metadata as SharpMetadata } from 'sharp';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
]);

const ALLOWED_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const JPEG_QUALITY = 82;

interface MagicSig {
  offset: number;
  bytes: number[];
  mime: string;
  ext: string;
}

const MAGIC_SIGNATURES: MagicSig[] = [
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', ext: 'jpg' },
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mime: 'image/png', ext: 'png' },
  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif', ext: 'gif' },
  { offset: 0, bytes: [0x42, 0x4D], mime: 'image/bmp', ext: 'bmp' },
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', ext: 'webp' },
];

function detectFileType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      if (sig.mime === 'image/webp') {
        if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return { mime: sig.mime, ext: sig.ext };
        }
        continue;
      }
      return { mime: sig.mime, ext: sig.ext };
    }
  }
  return null;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string; originalName: string }> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('未选择文件或文件为空');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`文件大小超过限制（${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB）`);
    }

    const ext = (path.extname(file.originalname) || '').toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      throw new BadRequestException(`不支持的文件类型: ${ext || '未知'}，仅支持 ${Array.from(ALLOWED_EXTS).join('、')}`);
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIMES.has(mimeType)) {
      throw new BadRequestException(`不支持的 MIME 类型: ${mimeType || '未知'}`);
    }

    const detected = detectFileType(file.buffer);
    if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
      throw new BadRequestException('文件内容与声明类型不符，疑似伪造的文件类型');
    }

    if (!ALLOWED_EXTS.has(`.${detected.ext}`)) {
      throw new BadRequestException(`文件内容扩展名 ${detected.ext} 不在允许列表中`);
    }

    const buffer = await this.processImage(file.buffer, detected.ext, mimeType);

    const uniqueName = `${Date.now()}_${randomBytes(8).toString('hex')}.${detected.ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    return {
      url: `/uploads/${uniqueName}`,
      originalName: this.sanitizeFilename(file.originalname),
    };
  }

  private async processImage(buffer: Buffer, ext: string, mimeType: string): Promise<Buffer> {
    let metadata: SharpMetadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new BadRequestException('无法解析图片内容，文件可能已损坏');
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('无法解析图片内容，文件可能已损坏');
    }

    const longestEdge = Math.max(metadata.width, metadata.height);
    let targetBuffer: Buffer;

    if (mimeType === 'image/png' && metadata.channels === 4) {
      targetBuffer = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    } else if (longestEdge > 1920 || buffer.length > 1024 * 1024) {
      const scale = longestEdge > 1920 ? 1920 / longestEdge : 1;
      const w = Math.round(metadata.width * scale);
      const h = Math.round(metadata.height * scale);

      targetBuffer = await sharp(buffer)
        .resize(w, h, { fit: 'inside', withoutEnlargement: false })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      if (targetBuffer.length > 1024 * 1024 && JPEG_QUALITY > 50) {
        targetBuffer = await sharp(buffer)
          .resize(w, h, { fit: 'inside', withoutEnlargement: false })
          .jpeg({ quality: 50, mozjpeg: true })
          .toBuffer();
      }
    } else {
      targetBuffer = buffer;
    }

    return targetBuffer;
  }

  private sanitizeFilename(name: string): string {
    if (!name) return 'unnamed';
    return name.replace(/[<>:*?"\\/|\x00-\x1f]/g, '').slice(0, 200);
  }
}
