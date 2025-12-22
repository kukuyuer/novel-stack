import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
// ✅ 修复：添加这行 import
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, PrismaService],
})
export class BackupModule {}
