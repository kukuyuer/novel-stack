import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// @ts-ignore
import HTMLtoDOCX from 'html-to-docx';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportBookToDocx(bookId: string) {
    // 1. 查询全书内容
    const book = await this.prisma.books.findUnique({
      where: { id: bookId },
      include: {
        volumes: {
          orderBy: { order_index: 'asc' },
          include: {
            chapters: {
              orderBy: { order_index: 'asc' }
            }
          }
        }
      }
    });

    if (!book) throw new NotFoundException('书籍不存在');

    // 2. 构建 HTML 内容
    // ✅ 修复：删除了 book.author_name，暂时硬编码为 '佚名' 或留空
    // (如果要显示真实作者，需要关联查询 users 表，这里暂且简化)
    let fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Songti SC', 'SimSun', serif; } 
            h1 { text-align: center; page-break-before: always; font-size: 24pt; }
            h2 { font-size: 18pt; margin-top: 20px; }
            p { text-indent: 2em; line-height: 1.5; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-top: 200px; margin-bottom: 200px;">
            <h1 style="font-size: 36pt;">${book.title}</h1>
            <p>作者：佚名</p>
          </div>
    `;

    // 遍历卷
    for (const vol of book.volumes) {
      fullHtml += `<h1 style="page-break-before: always;">${vol.title}</h1>`;
      
      // 遍历章
      for (const chap of vol.chapters) {
        fullHtml += `<h2>${chap.title}</h2>`;
        // 处理正文：确保有内容
        const content = chap.content || '<p>（暂无内容）</p>';
        fullHtml += content;
      }
    }

    fullHtml += '</body></html>';

    // 3. 转换为 Buffer
    const buffer = await HTMLtoDOCX(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    return {
      buffer,
      filename: `${book.title}.docx`
    };
  }
}
