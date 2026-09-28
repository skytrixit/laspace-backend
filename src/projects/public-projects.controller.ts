import { Controller, Get, Param, Query } from '@nestjs/common'
import { ListProjectsDto } from './dto/list-projects.dto'
import { ProjectsService } from './projects.service'

/** Published projects only, with covers and galleries. */
@Controller('projects')
export class PublicProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  async list(@Query() query: ListProjectsDto) {
    return (await this.projects.listPublicFiltered(query)).map(this.projects.toPublic)
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.projects.toPublic(await this.projects.findPublicBySlug(slug))
  }
}
