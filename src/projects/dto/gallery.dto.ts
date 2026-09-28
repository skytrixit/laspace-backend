import { ArrayMaxSize, ArrayUnique, IsBoolean, IsInt } from 'class-validator'

/** The whole gallery, in order. An empty list clears it. */
export class GalleryDto {
  @ArrayMaxSize(100) @ArrayUnique() @IsInt({ each: true })
  mediaIds!: number[]
}

export class FeatureDto {
  @IsBoolean()
  isFeatured!: boolean
}
