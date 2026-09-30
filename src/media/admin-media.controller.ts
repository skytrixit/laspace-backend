import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UpdateMediaDto, UploadMediaDto } from './dto/upload-media.dto'
import { MediaService } from './media.service'
import { MediaUrlService } from './media-view'

@Controller('admin/media')
export class AdminMediaController {
  constructor(
    private readonly media: MediaService,
    private readonly urls: MediaUrlService,
  ) {}

  /** 202: the original is stored; derivatives follow. Poll GET /:id until status is `ready`. */
  @Post()
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() dto: UploadMediaDto) {
    return this.urls.view(await this.media.upload(file, dto.alt))
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.urls.view(await this.media.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMediaDto) {
    return this.urls.view(await this.media.setAlt(id, dto.altText ?? null))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.media.remove(id)
  }
}
