import { Injectable } from '@nestjs/common';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  // 创建实体 (人物/地点/道具)
  create(createEntityDto: CreateEntityDto) {
    return this.prisma.entities.create({
      data: {
        name: createEntityDto.name,
        type: createEntityDto.type, // 'character', 'location', 'item'
        description: createEntityDto.description,
        avatar_url: createEntityDto.avatarUrl,
        book_id: createEntityDto.bookId,
        attributes: createEntityDto.attributes || {}, // JSON 属性
      },
    });
  }

  // 获取某本书的所有实体，支持按类型筛选
  findAll(bookId: string, type?: string) {
    return this.prisma.entities.findMany({
      where: {
        book_id: bookId,
        ...(type ? { type } : {}), // 如果传了 type 就筛选
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.entities.findUnique({ where: { id } });
  }

  update(id: string, updateEntityDto: UpdateEntityDto) {
    return this.prisma.entities.update({
      where: { id },
      data: {
         name: updateEntityDto.name,
         description: updateEntityDto.description,
         avatar_url: updateEntityDto.avatarUrl,
         attributes: updateEntityDto.attributes,
      },
    });
  }

  remove(id: string) {
    return this.prisma.entities.delete({ where: { id } });
  }
}