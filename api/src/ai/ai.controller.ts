import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers')
  findAll() {
    return this.aiService.findAllProviders();
  }

  @Post('providers')
  create(@Body() body: any) {
    return this.aiService.saveProvider(body);
  }

  @Delete('providers/:id')
  remove(@Param('id') id: string) {
    return this.aiService.deleteProvider(+id);
  }

  // 调用 AI 接口
  @Post('generate')
  generate(@Body() body: { prompt: string, context: string, providerId: number }) {
    return this.aiService.generateText(body.prompt, body.context, body.providerId);
  }
}