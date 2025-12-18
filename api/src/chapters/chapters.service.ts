import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(createChapterDto: CreateChapterDto) {
    let volumeId = createChapterDto.volumeId;
    
    // 如果没传卷ID，默认找第一卷
    if (!volumeId && createChapterDto.bookId) {
      const firstVol = await this.prisma.volumes.findFirst({
        where: { book_id: createChapterDto.bookId },
        orderBy: { order_index: 'asc' }
      });
      if (firstVol) volumeId = firstVol.id;
    }
    if (!volumeId) throw new Error("无法找到卷信息");

    // 计算该卷目前的最后序号
    const lastChapter = await this.prisma.chapters.findFirst({
      where: { volume_id: volumeId },
      orderBy: { order_index: 'desc' }
    });
    const newOrder = (lastChapter?.order_index || 0) + 1;

    return this.prisma.chapters.create({
      data: {
        title: createChapterDto.title,
        content: '',
        volume_id: volumeId,
        order_index: newOrder,
        status: 'draft',
      },
    });
  }

  async findAllByBook(bookId: string) {
    return this.prisma.volumes.findMany({
      where: { book_id: bookId },
      orderBy: { order_index: 'asc' },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          select: { id: true, title: true, status: true, word_count: true, order_index: true, volume_id: true }
        }
      }
    });
  }

  findOne(id: string) { return this.prisma.chapters.findUnique({ where: { id } }); }

  update(id: string, updateChapterDto: UpdateChapterDto) {
    return this.prisma.chapters.update({ where: { id }, data: updateChapterDto });
  }

  remove(id: string) { return this.prisma.chapters.delete({ where: { id } }); }

  // 卷内移动 (上移/下移)
  async move(id: string, direction: 'up' | 'down') {
    const currentChapter = await this.prisma.chapters.findUnique({ where: { id } });
    if (!currentChapter) throw new NotFoundException();

    const neighbor = await this.prisma.chapters.findFirst({
      where: {
        volume_id: currentChapter.volume_id,
        order_index: direction === 'up' 
          ? { lt: currentChapter.order_index } 
          : { gt: currentChapter.order_index }
      },
      orderBy: { order_index: direction === 'up' ? 'desc' : 'asc' }
    });

    if (neighbor) {
      await this.prisma.$transaction([
        this.prisma.chapters.update({
          where: { id: currentChapter.id },
          data: { order_index: neighbor.order_index }
        }),
        this.prisma.chapters.update({
          where: { id: neighbor.id },
          data: { order_index: currentChapter.order_index }
        })
      ]);
    }
    return { success: true };
  }

  // 🔥 新增：跨卷转移
  async transfer(chapterId: string, targetVolumeId: string) {
    // 1. 找出目标卷的最后顺位
    const lastChapterInTarget = await this.prisma.chapters.findFirst({
      where: { volume_id: targetVolumeId },
      orderBy: { order_index: 'desc' }
    });
    const newOrder = (lastChapterInTarget?.order_index || 0) + 1;

    // 2. 更新章节的 volume_id 和 order_index
    return this.prisma.chapters.update({
      where: { id: chapterId },
      data: {
        volume_id: targetVolumeId,
        order_index: newOrder
      }
    });
  }
}