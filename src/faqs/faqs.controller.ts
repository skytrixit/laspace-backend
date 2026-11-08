import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { Feature } from '../common/decorators/feature.decorator'
import { PublishDto } from '../common/dto/publish.dto'
import { ReorderDto } from '../common/dto/reorder.dto'
import { CreateFaqDto } from './dto/create-faq.dto'
import { UpdateFaqDto } from './dto/update-faq.dto'
import { FaqsService } from './faqs.service'

@Controller('faqs')
export class PublicFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  async list() {
    return (await this.faqs.listPublic()).map(this.faqs.toPublic)
  }
}

@Feature('faqs')
@Controller('admin/faqs')
export class AdminFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  async list() {
    return (await this.faqs.listAdmin()).map(this.faqs.toAdmin)
  }

  @Post()
  async create(@Body() dto: CreateFaqDto) {
    return this.faqs.toAdmin(await this.faqs.create(dto))
  }

  @Put('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return (await this.faqs.reorder(dto.ids)).map(this.faqs.toAdmin)
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.faqs.toAdmin(await this.faqs.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) {
    return this.faqs.toAdmin(await this.faqs.update(id, dto))
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishDto) {
    return this.faqs.toAdmin(await this.faqs.setPublished(id, dto.isPublished))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.faqs.remove(id)
  }
}
