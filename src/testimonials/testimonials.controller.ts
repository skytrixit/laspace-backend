import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { PublishDto } from '../common/dto/publish.dto'
import { ReorderDto } from '../common/dto/reorder.dto'
import { CreateTestimonialDto } from './dto/create-testimonial.dto'
import { UpdateTestimonialDto } from './dto/update-testimonial.dto'
import { TestimonialsService } from './testimonials.service'

@Controller('testimonials')
export class PublicTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  async list() {
    return (await this.testimonials.listPublic()).map(this.testimonials.toPublic)
  }
}

@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  async list() {
    return (await this.testimonials.listAdmin()).map(this.testimonials.toAdmin)
  }

  @Post()
  async create(@Body() dto: CreateTestimonialDto) {
    return this.testimonials.toAdmin(await this.testimonials.create(dto))
  }

  @Put('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return (await this.testimonials.reorder(dto.ids)).map(this.testimonials.toAdmin)
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.testimonials.toAdmin(await this.testimonials.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestimonialDto) {
    return this.testimonials.toAdmin(await this.testimonials.update(id, dto))
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishDto) {
    return this.testimonials.toAdmin(await this.testimonials.setPublished(id, dto.isPublished))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.testimonials.remove(id)
  }
}
