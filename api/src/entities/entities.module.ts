import { Module } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
// ✅ 必须添加这一行导入
import { PrismaService } from '../prisma.service'; 

@Module({
  controllers: [EntitiesController],
  providers: [EntitiesService, PrismaService], 
})
export class EntitiesModule {}