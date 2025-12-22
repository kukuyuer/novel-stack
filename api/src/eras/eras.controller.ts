import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ErasService } from './eras.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';

@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Post()
  create(@Body() createEraDto: CreateEraDto) {
    return this.erasService.create(createEraDto);
  }

  @Get()
  findAll(@Query('bookId') bookId: string) {
    return this.erasService.findAll(bookId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEraDto: UpdateEraDto) {
    return this.erasService.update(id, updateEraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.erasService.remove(id);
  }
}
