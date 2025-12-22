import { Controller, Get, Post, Param, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BackupService } from './backup.service';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  // 导出 JSON
  @Get('export/:id')
  async exportBook(@Param('id') id: string, @Res() res: Response) {
    const data = await this.backupService.exportBook(id);
    
    // 将对象转为 JSON 字符串
    const jsonStr = JSON.stringify(data, null, 2);
    
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(data.title)}.json`,
    });
    res.send(jsonStr);
  }

  // 导入 JSON (恢复)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importBook(@UploadedFile() file: Express.Multer.File) {
    const jsonContent = JSON.parse(file.buffer.toString('utf-8'));
    return this.backupService.restoreBook(jsonContent);
  }
}