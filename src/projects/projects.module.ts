import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaModule } from '../media/media.module'
import { AdminProjectsController } from './admin-projects.controller'
import { ProjectMedia } from './project-media.entity'
import { Project } from './project.entity'
import { ProjectsService } from './projects.service'
import { PublicProjectsController } from './public-projects.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMedia]), MediaModule],
  controllers: [PublicProjectsController, AdminProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
