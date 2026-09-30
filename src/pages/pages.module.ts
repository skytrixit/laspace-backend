import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { BrandsModule } from '../brands/brands.module'
import { FaqsModule } from '../faqs/faqs.module'
import { ProjectsModule } from '../projects/projects.module'
import { ServicesModule } from '../services/services.module'
import { SettingsModule } from '../settings/settings.module'
import { TestimonialsModule } from '../testimonials/testimonials.module'
import { InvalidatePagesOnWrite, PagesCache } from './pages-cache'
import { PagesController } from './pages.controller'
import { PagesService } from './pages.service'

@Module({
  imports: [ServicesModule, ProjectsModule, TestimonialsModule, BrandsModule, FaqsModule, SettingsModule],
  controllers: [PagesController],
  providers: [PagesCache, PagesService, { provide: APP_INTERCEPTOR, useClass: InvalidatePagesOnWrite }],
  exports: [PagesService, PagesCache],
})
export class PagesModule {}
