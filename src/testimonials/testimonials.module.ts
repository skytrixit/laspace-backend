import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaModule } from '../media/media.module'
import { Testimonial } from './testimonial.entity'
import { AdminTestimonialsController, PublicTestimonialsController } from './testimonials.controller'
import { TestimonialsService } from './testimonials.service'

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial]), MediaModule],
  controllers: [PublicTestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
