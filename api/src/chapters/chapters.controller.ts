import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.chaptersService.create(createChapterDto);
  }

  @Get('catalog')
  findAllByBook(@Query('bookId') bookId: string) {
    return this.chaptersService.findAllByBook(bookId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChapterDto: UpdateChapterDto) {
    return this.chaptersService.update(id, updateChapterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }

  @Post(':id/move')
  move(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.chaptersService.move(id, direction);
  }

  // 🔥 新增：转移接口
  @Post(':id/transfer')
  transfer(@Param('id') id: string, @Body('targetVolumeId') targetVolumeId: string) {
    return this.chaptersService.transfer(id, targetVolumeId);
  }
}