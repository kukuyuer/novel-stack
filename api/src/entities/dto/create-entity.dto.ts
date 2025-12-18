export class CreateEntityDto {
  name: string;
  type: string;
  bookId: string;
  description?: string;
  avatarUrl?: string;
  attributes?: any; // <--- 必须有这一行
}