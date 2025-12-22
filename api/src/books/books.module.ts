// api/src/books/books.module.ts
import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { PrismaService } from '../prisma.service'; // <--- 导入

@Module({
  controllers: [BooksController],
  providers: [BooksService, PrismaService], // <--- 添加到 providers
})
export class BooksModule {}
