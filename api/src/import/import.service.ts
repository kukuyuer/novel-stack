import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as mammoth from 'mammoth';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async importFile(file: Express.Multer.File, title: string) {
    if (!file) throw new BadRequestException('请上传文件');

    let content = '';

    if (file.mimetype === 'text/plain') {
      content = file.buffer.toString('utf-8');
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      content = result.value;
    } else {
      throw new BadRequestException('仅支持 .txt 或 .docx 文件');
    }

    const book = await this.prisma.books.create({
      data: {
        title: title || file.originalname.replace(/\.(txt|docx)$/, ''),
        status: 'ongoing',
        summary: `通过 ${file.originalname.split('.').pop()} 导入`,
        volumes: {
          create: { title: '正文卷', order_index: 1 }
        }
      },
      include: { volumes: true }
    });

    const volumeId = book.volumes[0].id;

    const chapterRegex = /(^\s*第[0-9零一二三四五六七八九十百千万]+[章卷节].*)/gm;
    
    const parts = content.split(chapterRegex);
    
    // ✅ 修复：显式定义类型为 any[]，否则 TS 会认为是 never[]
    const chaptersData: any[] = [];
    let orderIndex = 1;

    if (parts[0] && parts[0].trim().length > 0) {
       chaptersData.push({
         title: '序章 / 前言',
         content: this.formatContent(parts[0]),
         volume_id: volumeId,
         order_index: orderIndex++,
         status: 'draft',
         word_count: parts[0].length
       });
    }

    for (let i = 1; i < parts.length; i += 2) {
      const chapTitle = parts[i].trim();
      const chapContent = parts[i + 1] ? this.formatContent(parts[i + 1]) : '';
      
      if (chapTitle.length < 50) { 
        chaptersData.push({
          title: chapTitle,
          content: chapContent,
          volume_id: volumeId,
          order_index: orderIndex++,
          status: 'draft',
          word_count: chapContent.length
        });
      }
    }

    if (chaptersData.length > 0) {
      await this.prisma.chapters.createMany({ data: chaptersData });
    }

    return { success: true, bookId: book.id, count: chaptersData.length };
  }

  private formatContent(text: string): string {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>　　${line}</p>`)
      .join('');
  }
}
