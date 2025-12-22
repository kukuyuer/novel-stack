import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  // 📥 导出：获取全书数据
  async exportBook(bookId: string) {
    const book = await this.prisma.books.findUnique({
      where: { id: bookId },
      include: {
        volumes: { include: { chapters: true } },
        entities: true,
        eras: true,
        timeline_events: { include: { event_participants: true } },
        relationships: { include: { relationship_snapshots: true } }
      }
    });
    if (!book) throw new BadRequestException("书籍不存在");
    return book;
  }

  // 📤 恢复：导入 JSON 并重构关联
  async restoreBook(data: any) {
    // 使用事务确保原子性
    return await this.prisma.$transaction(async (tx) => {
      // 1. 创建书
      const newBook = await tx.books.create({
        data: {
          title: data.title + " (副本)", // 避免重名
          summary: data.summary,
          status: data.status,
          cover_url: data.cover_url
        }
      });

      // ID 映射表：旧ID -> 新ID
      const entityMap = new Map<string, string>();
      const eraMap = new Map<string, string>();

      // 2. 恢复卷和章节
      for (const vol of data.volumes) {
        const newVol = await tx.volumes.create({
          data: { title: vol.title, order_index: vol.order_index, book_id: newBook.id }
        });
        if (vol.chapters && vol.chapters.length > 0) {
          const chaptersData = vol.chapters.map((ch: any) => ({
            title: ch.title, content: ch.content, word_count: ch.word_count,
            status: ch.status, order_index: ch.order_index, volume_id: newVol.id
          }));
          await tx.chapters.createMany({ data: chaptersData });
        }
      }

      // 3. 恢复实体 (Entities) 并记录 ID 映射
      for (const ent of data.entities) {
        const newEnt = await tx.entities.create({
          data: {
            name: ent.name, type: ent.type, description: ent.description,
            avatar_url: ent.avatar_url, book_id: newBook.id, attributes: ent.attributes || {}
          }
        });
        entityMap.set(ent.id, newEnt.id);
      }

      // 4. 恢复纪元 (Eras) 并记录 ID 映射
      for (const era of data.eras) {
        const newEra = await tx.eras.create({
          data: {
            name: era.name, description: era.description, order_index: era.order_index,
            start_absolute_tick: BigInt(era.start_absolute_tick), book_id: newBook.id
          }
        });
        eraMap.set(era.id, newEra.id);
      }

      // 5. 恢复时间轴事件 (Timeline)
      for (const ev of data.timeline_events) {
        // 替换为新 ID
        const newEraId = ev.era_id ? eraMap.get(ev.era_id) : null;
        
        const newEv = await tx.timeline_events.create({
          data: {
            title: ev.title, description: ev.description, book_id: newBook.id,
            era_id: newEraId, year_in_era: ev.year_in_era, month_in_era: ev.month_in_era,
            day_in_era: ev.day_in_era, absolute_tick: BigInt(ev.absolute_tick)
          }
        });

        // 恢复事件参与者
        if (ev.event_participants && ev.event_participants.length > 0) {
          for (const p of ev.event_participants) {
            const newEntId = entityMap.get(p.entity_id);
            if (newEntId) {
              await tx.event_participants.create({
                data: { event_id: newEv.id, entity_id: newEntId, role: p.role }
              });
            }
          }
        }
      }

      // 6. 恢复关系 (Relationships)
      for (const rel of data.relationships) {
        const newSource = entityMap.get(rel.entity_a_id);
        const newTarget = entityMap.get(rel.entity_b_id);

        if (newSource && newTarget) {
          const newRel = await tx.relationships.create({
            data: { book_id: newBook.id, entity_a_id: newSource, entity_b_id: newTarget }
          });

          // 恢复快照
          if (rel.relationship_snapshots) {
            for (const snap of rel.relationship_snapshots) {
              await tx.relationship_snapshots.create({
                data: {
                  relationship_id: newRel.id,
                  start_tick: BigInt(snap.start_tick),
                  relation_type: snap.relation_type,
                  label: snap.label
                }
              });
            }
          }
        }
      }

      return newBook;
    });
  }
}