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
            // 这里是中文，必须保证文件编码正确
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

  remove(id: string) {
    return this.prisma.books.delete({ where: { id } });
  }
}
