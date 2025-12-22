import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
// ❌ 错误写法: import { FileInterceptor } from '@platform-express/multer';
// ✅ 正确写法:
import { FileInterceptor } from '@nestjs/platform-express'; 
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadFile(file);
    return { url };
  }
}