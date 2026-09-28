import { AdminSession } from '../auth/admin-session.entity'
import { AdminUser } from '../auth/admin-user.entity'
import { Brand } from '../brands/brand.entity'
import { Enquiry } from '../enquiries/enquiry.entity'
import { Faq } from '../faqs/faq.entity'
import { MediaAsset } from '../media/media-asset.entity'
import { ProjectMedia } from '../projects/project-media.entity'
import { Project } from '../projects/project.entity'
import { Service } from '../services/service.entity'
import { SiteSetting } from '../settings/site-setting.entity'
import { Testimonial } from '../testimonials/testimonial.entity'

/** Every entity, in one place, for the data source and the migration CLI. */
export const ENTITIES = [
  AdminUser,
  AdminSession,
  Enquiry,
  MediaAsset,
  Service,
  Project,
  ProjectMedia,
  Testimonial,
  Brand,
  Faq,
  SiteSetting,
]
