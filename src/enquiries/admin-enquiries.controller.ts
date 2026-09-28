import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Query } from '@nestjs/common'
import { ListEnquiriesDto } from './dto/list-enquiries.dto'
import { UpdateEnquiryDto } from './dto/update-enquiry.dto'
import { EnquiriesService } from './enquiries.service'

/** The inbox. Protected by the global SessionGuard — nothing here is public. */
@Controller('admin/enquiries')
export class AdminEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  list(@Query() query: ListEnquiriesDto) {
    return this.enquiries.list(query)
  }

  /* Declared before :id so "summary" is never read as an id. */
  @Get('summary')
  summary() {
    return this.enquiries.summary()
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.enquiries.get(id)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnquiryDto) {
    return this.enquiries.setHandled(id, dto.isHandled)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.enquiries.remove(id)
  }
}
