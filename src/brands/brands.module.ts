import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaModule } from '../media/media.module'
import { Brand } from './brand.entity'
import { AdminBrandsController, PublicBrandsController } from './brands.controller'
import { BrandsService } from './brands.service'

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), MediaModule],
  controllers: [PublicBrandsController, AdminBrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
