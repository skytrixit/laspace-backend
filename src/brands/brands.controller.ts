import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { PublishDto } from '../common/dto/publish.dto'
import { ReorderDto } from '../common/dto/reorder.dto'
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'

@Controller('brands')
export class PublicBrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list() {
    return (await this.brands.listPublic()).map(this.brands.toPublic)
  }
}

@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list() {
    return (await this.brands.listAdmin()).map(this.brands.toAdmin)
  }

  @Post()
  async create(@Body() dto: CreateBrandDto) {
    return this.brands.toAdmin(await this.brands.create(dto))
  }

  @Put('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return (await this.brands.reorder(dto.ids)).map(this.brands.toAdmin)
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.brands.toAdmin(await this.brands.get(id))
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brands.toAdmin(await this.brands.update(id, dto))
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishDto) {
    return this.brands.toAdmin(await this.brands.setPublished(id, dto.isPublished))
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.brands.remove(id)
  }
}
