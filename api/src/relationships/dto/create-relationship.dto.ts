export class CreateRelationshipDto {
  bookId: string;
  sourceId: string; // 主动方ID
  targetId: string; // 被动方ID
  relationType: string; // friend, enemy, lover, family
  description?: string;
}
