import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { PublishDto } from '../common/dto/publish.dto'
import { ReorderDto } from '../common/dto/reorder.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'
import { ServicesService } from './services.service'

@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  async list() {
    return (await this.services.listAdmin()).map(this.services.toAdmin)
  }

  @Post()
  async create(@Body() dto: CreateServiceDto) {
    return this.services.toAdmin(await this.services.createFromDto(dto))
  }

  @Put('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return (await this.services.reorder(dto.ids)).map(this.services.toAdmin)
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.services.toAdmin(await this.services.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.services.toAdmin(await this.services.updateFromDto(id, dto))
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishDto) {
    return this.services.toAdmin(await this.services.setPublished(id, dto.isPublished))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.services.remove(id)
  }
}
