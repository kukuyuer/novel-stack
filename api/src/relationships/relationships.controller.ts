import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';

@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post()
  create(@Body() dto: CreateRelationshipDto) {
    return this.relationshipsService.create(dto);
  }

  @Get()
  findAll(@Query('bookId') bookId: string) {
    return this.relationshipsService.findAll(bookId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.relationshipsService.remove(id);
  }
}