import { IsBoolean } from 'class-validator'

/** The inbox's one write: mark an enquiry handled, or not. */
export class UpdateEnquiryDto {
  @IsBoolean()
  isHandled!: boolean
}
