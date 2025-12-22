import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { UpdateTimelineDto } from './dto/update-timeline.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  // create 方法保持不变... (省略以节省篇幅，请保留之前的 create 代码)
  async create(dto: CreateTimelineDto) {
      // ...保留你之前的 create 代码...
      // (为了确保文件完整，建议你只替换 update 方法，或者把之前的 create 复制过来)
      // 这里简写了：
      let absoluteTick = BigInt(0);
      const eraId = dto.eraId && dto.eraId.trim() !== '' ? dto.eraId : null;
      if (eraId) {
        const era = await this.prisma.eras.findUnique({ where: { id: eraId } });
        if (!era) throw new BadRequestException('所选纪元不存在');
        absoluteTick = BigInt(era.start_absolute_tick) + BigInt(dto.year || 0);
      } else {
        absoluteTick = BigInt(dto.year || 0);
      }
      const participantCreates = dto.entityIds?.map(entityId => ({
        entities: { connect: { id: entityId } }, 
        role: 'participant'
      })) || [];
      return this.prisma.timeline_events.create({
        data: {
          title: dto.title, description: dto.description || null,
          books: { connect: { id: dto.bookId } },
          ...(eraId ? { eras: { connect: { id: eraId } } } : {}),
          year_in_era: dto.year ? Number(dto.year) : null,
          absolute_tick: absoluteTick,
          event_participants: { create: participantCreates }
        },
      });
  }

  findAll(bookId: string) {
    return this.prisma.timeline_events.findMany({
      where: { book_id: bookId },
      orderBy: { absolute_tick: 'asc' },
      include: { eras: true, event_participants: { include: { entities: true } } }
    });
  }

  findOne(id: string) { return this.prisma.timeline_events.findUnique({ where: { id } }); }

  // ✅ 核心升级：Update 支持修改时间和纪元
  async update(id: string, dto: UpdateTimelineDto) {
    const event = await this.prisma.timeline_events.findUnique({ where: { id } });
    if (!event) throw new BadRequestException('Event not found');

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;

    // 检查是否需要重新计算时间
    const newEraId = dto.eraId !== undefined ? (dto.eraId && dto.eraId.trim() !== '' ? dto.eraId : null) : undefined;
    const newYear = dto.year !== undefined ? Number(dto.year) : undefined;

    // 如果修改了 纪元 或 年份，必须重新计算 absolute_tick
    if (newEraId !== undefined || newYear !== undefined) {
      const targetEraId = newEraId !== undefined ? newEraId : event.era_id;
      const targetYear = newYear !== undefined ? newYear : event.year_in_era;

      let newAbsoluteTick = BigInt(0);

      if (targetEraId) {
        const era = await this.prisma.eras.findUnique({ where: { id: targetEraId } });
        if (!era) throw new BadRequestException('纪元不存在');
        newAbsoluteTick = era.start_absolute_tick + BigInt(targetYear || 0);
        
        // 更新关联
        updateData.eras = { connect: { id: targetEraId } };
      } else {
        // 如果变成了无纪元
        newAbsoluteTick = BigInt(targetYear || 0);
        updateData.eras = { disconnect: true }; // 断开旧纪元
      }

      updateData.year_in_era = targetYear;
      updateData.absolute_tick = newAbsoluteTick;
    }

    // 如果需要更新参与者 (暂时略过，稍微复杂，建议删了重加)

    return this.prisma.timeline_events.update({
      where: { id },
      data: updateData
    });
  }

  remove(id: string) { return this.prisma.timeline_events.delete({ where: { id } }); }
}