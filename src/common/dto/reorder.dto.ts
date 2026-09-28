import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsInt } from 'class-validator'

/** The new order, as ids. Position in the array becomes display order. */
export class ReorderDto {
  @ArrayMinSize(1) @ArrayMaxSize(500) @ArrayUnique() @IsInt({ each: true })
  ids!: number[]
}
