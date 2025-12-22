import { PartialType } from '@nestjs/mapped-types';
import { CreateChapterDto } from './create-chapter.dto';

export class UpdateChapterDto extends PartialType(CreateChapterDto) {
  content?: string; // 允许更新正文
  content_state?: any; // 允许更新富文本状态
  word_count?: number;
}