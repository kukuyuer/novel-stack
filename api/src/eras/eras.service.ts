import { Injectable } from '@nestjs/common';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ErasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEraDto) {
    // 1. 计算排序 (Order Index)
    const lastEra = await this.prisma.eras.findFirst({
      where: { book_id: dto.bookId },
      orderBy: { order_index: 'desc' }
    });
    const newOrder = (lastEra?.order_index || 0) + 1;

    // 2. 确定起始时间
    // 如果用户填了 startTick，就用用户的；否则自动接在上一个后面 (+10000)
    let startTick = BigInt(0);
    if (dto.startTick !== undefined && dto.startTick !== null) {
      startTick = BigInt(dto.startTick);
    } else if (lastEra) {
      startTick = lastEra.start_absolute_tick + BigInt(10000);
    }

    return this.prisma.eras.create({
      data: {
        name: dto.name,
        book_id: dto.bookId,
        order_index: newOrder,
        start_absolute_tick: startTick,
        description: dto.description,
      }
    });
  }

  findAll(bookId: string) {
    return this.prisma.eras.findMany({
      where: { book_id: bookId },
      orderBy: { start_absolute_tick: 'asc' } // 改为按绝对时间排序
    });
  }

  // ✅ 修复：支持修改纪元名和起始时间
  async update(id: string, dto: UpdateEraDto) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.description) data.description = dto.description;
    
    // 如果修改了起始时间，需要更新
    if (dto.startTick !== undefined) {
      data.start_absolute_tick = BigInt(dto.startTick);
      
      // 注意：修改纪元起始时间后，该纪元下所有已存在的事件的 absolute_tick 
      // 理论上应该重新计算。MVP版本暂不自动重算所有事件，
      // 建议用户修改纪元时间后，手动检查一下关键事件。
    }

    return this.prisma.eras.update({
      where: { id },
      data
    });
  }

  remove(id: string) {
    return this.prisma.eras.delete({ where: { id } });
  }
}