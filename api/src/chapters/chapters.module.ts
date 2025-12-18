// api/src/chapters/chapters.module.ts
import { Module } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { PrismaService } from '../prisma.service'; // <--- 1. 导入 PrismaService

@Module({
  controllers: [ChaptersController],
  providers: [
    ChaptersService, 
    PrismaService // <--- 2. 把它加到 providers 数组里
  ], 
})
export class ChaptersModule {}