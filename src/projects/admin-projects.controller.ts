import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { PublishDto } from '../common/dto/publish.dto'
import { ReorderDto } from '../common/dto/reorder.dto'
import { CreateProjectDto } from './dto/create-project.dto'
import { FeatureDto, GalleryDto } from './dto/gallery.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  async list() {
    return (await this.projects.listAdmin()).map(this.projects.toAdmin)
  }

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.projects.toAdmin(await this.projects.createFromDto(dto))
  }

  @Put('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return (await this.projects.reorder(dto.ids)).map(this.projects.toAdmin)
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.projects.toAdmin(await this.projects.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projects.toAdmin(await this.projects.updateFromDto(id, dto))
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishDto) {
    return this.projects.toAdmin(await this.projects.setPublished(id, dto.isPublished))
  }

  @Patch(':id/feature')
  async feature(@Param('id', ParseIntPipe) id: number, @Body() dto: FeatureDto) {
    return this.projects.toAdmin(await this.projects.setFeatured(id, dto.isFeatured))
  }

  @Put(':id/gallery')
  async gallery(@Param('id', ParseIntPipe) id: number, @Body() dto: GalleryDto) {
    return this.projects.toAdmin(await this.projects.setGallery(id, dto.mediaIds))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.projects.remove(id)
  }
}
