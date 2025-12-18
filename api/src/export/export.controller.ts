import { Controller, Get, Param, Res } from '@nestjs/common';
import { ExportService } from './export.service';
// ✅ 修复：必须使用 import type 导入 Express 的接口
import type { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':bookId/docx')
  async exportDocx(@Param('bookId') bookId: string, @Res() res: Response) {
    const { buffer, filename } = await this.exportService.exportBookToDocx(bookId);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
