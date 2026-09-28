import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaModule } from '../media/media.module'
import { AdminServicesController } from './admin-services.controller'
import { PublicServicesController } from './public-services.controller'
import { Service } from './service.entity'
import { ServicesService } from './services.service'

@Module({
  imports: [TypeOrmModule.forFeature([Service]), MediaModule],
  controllers: [PublicServicesController, AdminServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
