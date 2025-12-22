import { PartialType } from '@nestjs/mapped-types';
import { CreateEntityDto } from './create-entity.dto';

export class UpdateEntityDto extends PartialType(CreateEntityDto) {
  // 这里通常不需要手动写 attributes，因为 PartialType 会自动继承
  // 但为了保险，或者如果你之前的 CreateEntityDto 没写 attributes，我们显式加上
  attributes?: any;
}