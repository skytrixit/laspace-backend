import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailModule } from '../mail/mail.module'
import { AdminEnquiriesController } from './admin-enquiries.controller'
import { EnquiriesService } from './enquiries.service'
import { Enquiry } from './enquiry.entity'
import { PublicEnquiriesController } from './public-enquiries.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Enquiry]), MailModule],
  controllers: [PublicEnquiriesController, AdminEnquiriesController],
  providers: [EnquiriesService],
})
export class EnquiriesModule {}
