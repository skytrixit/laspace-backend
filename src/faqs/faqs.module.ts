import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Faq } from './faq.entity'
import { AdminFaqsController, PublicFaqsController } from './faqs.controller'
import { FaqsService } from './faqs.service'

@Module({
  imports: [TypeOrmModule.forFeature([Faq])],
  controllers: [PublicFaqsController, AdminFaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
