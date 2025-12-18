import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VolumesService {
  constructor(private prisma: PrismaService) {}

  async create(createVolumeDto: CreateVolumeDto) {
    const lastVol = await this.prisma.volumes.findFirst({
      where: { book_id: createVolumeDto.bookId },
      orderBy: { order_index: 'desc' }
    });
    const newOrder = (lastVol?.order_index || 0) + 1;

    return this.prisma.volumes.create({
      data: {
        title: createVolumeDto.title,
        book_id: createVolumeDto.bookId,
        order_index: newOrder,
      }
    });
  }

  findAll() { return `This action returns all volumes`; }
  findOne(id: string) { return this.prisma.volumes.findUnique({ where: { id } }); }

  update(id: string, updateVolumeDto: UpdateVolumeDto) {
    return this.prisma.volumes.update({
      where: { id },
      data: { title: updateVolumeDto.title }
    });
  }

  remove(id: string) { return this.prisma.volumes.delete({ where: { id } }); }

  // 🔥 新增：移动卷逻辑
  async move(id: string, direction: 'up' | 'down') {
    const currentVol = await this.prisma.volumes.findUnique({ where: { id } });
    if (!currentVol) throw new NotFoundException();

    const neighbor = await this.prisma.volumes.findFirst({
      where: {
        book_id: currentVol.book_id,
        order_index: direction === 'up' 
          ? { lt: currentVol.order_index } 
          : { gt: currentVol.order_index }
      },
      orderBy: { order_index: direction === 'up' ? 'desc' : 'asc' }
    });

    if (neighbor) {
      await this.prisma.$transaction([
        this.prisma.volumes.update({
          where: { id: currentVol.id },
          data: { order_index: neighbor.order_index }
        }),
        this.prisma.volumes.update({
          where: { id: neighbor.id },
          data: { order_index: currentVol.order_index }
        })
      ]);
    }
    return { success: true };
  }
}