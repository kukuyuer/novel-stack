import { Injectable } from '@nestjs/common';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RelationshipsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRelationshipDto) {
    // 1. 检查是否存在
    const existing = await this.prisma.relationships.findFirst({
      where: {
        book_id: dto.bookId,
        entity_a_id: dto.sourceId,
        entity_b_id: dto.targetId
      }
    });

    let relationshipId = existing?.id;

    if (!existing) {
      // 直接使用 Unchecked Input
      const rel = await this.prisma.relationships.create({
        data: {
          book_id: dto.bookId,
          entity_a_id: dto.sourceId,
          entity_b_id: dto.targetId,
        }
      });
      relationshipId = rel.id;
    }

    // 2. 创建快照
    return this.prisma.relationship_snapshots.create({
      data: {
        relationships: { connect: { id: relationshipId } },
        start_tick: BigInt(0),
        relation_type: dto.relationType,
        label: dto.description || dto.relationType,
      }
    });
  }

  async findAll(bookId: string) {
    // 1. 查出所有关系记录
    const rels = await this.prisma.relationships.findMany({
      where: { book_id: bookId },
      include: {
        relationship_snapshots: {
          orderBy: { start_tick: 'desc' },
          take: 1
        }
      }
    });

    // 2. 收集所有涉及的人物 ID
    const entityIds = new Set<string>();
    rels.forEach(r => {
        if(r.entity_a_id) entityIds.add(r.entity_a_id);
        if(r.entity_b_id) entityIds.add(r.entity_b_id);
    });

    // 3. 手动查询人物信息
    const entities = await this.prisma.entities.findMany({
        where: { id: { in: Array.from(entityIds) } },
        select: { id: true, name: true, avatar_url: true }
    });
    
    // 建立 ID -> Entity 的映射
    const entityMap = new Map(entities.map(e => [e.id, e]));

    // 4. 组装数据给前端
    return rels.map(r => {
      const snapshot = r.relationship_snapshots[0];
      
      // ✅ 修复：使用 ?? '' 处理 null 值，满足 TypeScript 类型要求
      const sourceId = r.entity_a_id ?? '';
      const targetId = r.entity_b_id ?? '';

      return {
        id: r.id,
        source: entityMap.get(sourceId) || { id: sourceId, name: 'Unknown' },
        target: entityMap.get(targetId) || { id: targetId, name: 'Unknown' },
        type: snapshot?.relation_type || 'unknown',
        label: snapshot?.label || '',
      };
    });
  }

  remove(id: string) {
    return this.prisma.relationships.delete({ where: { id } });
  }
}
