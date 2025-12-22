import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VolumesService } from './volumes.service';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

@Controller('volumes')
export class VolumesController {
  constructor(private readonly volumesService: VolumesService) {}

  @Post()
  create(@Body() createVolumeDto: CreateVolumeDto) {
    return this.volumesService.create(createVolumeDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVolumeDto: UpdateVolumeDto) {
    return this.volumesService.update(id, updateVolumeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volumesService.remove(id);
  }

  // 🔥 新增接口
  @Post(':id/move')
  move(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.volumesService.move(id, direction);
  }
}