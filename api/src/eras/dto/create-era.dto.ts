export class CreateEraDto {
  name: string;
  bookId: string;
  description?: string;
  // 新增：允许手动指定起始时间 (对应主世界的第几年)
  startTick?: number; 
}
