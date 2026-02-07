import { IsArray, IsUUID } from 'class-validator';

export class UpdateNavOrderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
