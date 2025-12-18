export class CreateTimelineDto {
  title: string;
  bookId: string;
  description?: string;
  
  eraId?: string;
  year?: number;
  month?: number;
  day?: number;

  // 新增：参与者 ID 列表
  entityIds?: string[];
}
