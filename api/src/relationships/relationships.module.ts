import { Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RelationshipsController],
  providers: [RelationshipsService, PrismaService],
})
export class RelationshipsModule {}