export class CreateChapterDto {
  title: string;
  bookId?: string; // 可选，如果为了简化逻辑
  volumeId?: string;
}