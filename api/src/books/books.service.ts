import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    let user = await this.prisma.users.findFirst();
    if (!user) {
      user = await this.prisma.users.create({
        data: { username: 'admin_author', password_hash: '123' },
      });
    }

    return this.prisma.books.create({
      data: {
        title: createBookDto.title,
        summary: createBookDto.summary,
        user_id: user.id,
        status: 'ongoing',
        volumes: {
          create: {
            title: '第一卷：初出茅庐',
            order_index: 1,
          },
        },
      },
      include: { volumes: true },
    });
  }

  findAll() {
    return this.prisma.books.findMany({ include: { volumes: true } });
  }

  findOne(id: string) {
    return this.prisma.books.findUnique({ where: { id } });
  }

  update(id: string, updateBookDto: UpdateBookDto) {
    return this.prisma.books.update({ where: { id }, data: updateBookDto });
  }

  // ✅ 核心修复：手动级联删除所有关联数据
  async remove(id: string) {
    // 1. 清理关系网 (Relationships)
    // 必须先删快照，再删关系
    const rels = await this.prisma.relationships.findMany({ where: { book_id: id } });
    const relIds = rels.map(r => r.id);
    if (relIds.length > 0) {
        await this.prisma.relationship_snapshots.deleteMany({ where: { relationship_id: { in: relIds } } });
        await this.prisma.relationships.deleteMany({ where: { book_id: id } });
    }

    // 2. 清理时间轴 (Timeline)
    // 必须先删参与者，再删事件
    const events = await this.prisma.timeline_events.findMany({ where: { book_id: id } });
    const eventIds = events.map(e => e.id);
    if (eventIds.length > 0) {
        await this.prisma.event_participants.deleteMany({ where: { event_id: { in: eventIds } } });
        await this.prisma.timeline_events.deleteMany({ where: { book_id: id } });
    }

    // 3. 清理纪元 (Eras)
    await this.prisma.eras.deleteMany({ where: { book_id: id } });

    // 4. 清理实体/人物 (Entities)
    // 必须在清理完 Timeline 和 Relationships 之后删，因为它们引用了 Entity
    await this.prisma.entities.deleteMany({ where: { book_id: id } });

    // 5. 最后删除书籍 (会级联删除 Volumes 和 Chapters)
    return this.prisma.books.delete({ where: { id } });
  }
}
