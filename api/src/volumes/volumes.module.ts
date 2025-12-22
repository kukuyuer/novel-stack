import { Module } from '@nestjs/common';
import { VolumesService } from './volumes.service';
import { VolumesController } from './volumes.controller';
import { PrismaService } from '../prisma.service'; // 导入

@Module({
  controllers: [VolumesController],
  providers: [VolumesService, PrismaService], // 注册
})
export class VolumesModule {}