import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const MAX_UPLOAD_MB = 10;

@ApiTags('上传')
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: '通用图片上传（仅支持图片，最大 10MB）' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowed.includes(mime)) {
          return cb(new BadRequestException(`不支持的文件类型: ${mime}，仅支持 jpg/png/gif/webp/bmp`), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    try {
      return await this.uploadService.saveFile(file);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      if (err?.code === 'LIMIT_FILE_SIZE') {
        throw new HttpException(`文件大小超过 ${MAX_UPLOAD_MB}MB 限制`, HttpStatus.BAD_REQUEST);
      }
      throw new BadRequestException(err?.message || '上传失败');
    }
  }
}
