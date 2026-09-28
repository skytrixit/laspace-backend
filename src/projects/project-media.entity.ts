import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { MediaAsset } from '../media/media-asset.entity'
import { Project } from './project.entity'

/** The ordered gallery of renders on a project. */
@Entity('project_media')
@Index('idx_project_media_position', ['projectId', 'position'])
export class ProjectMedia {
  @PrimaryColumn({ name: 'project_id', type: 'int', unsigned: true })
  projectId!: number

  @PrimaryColumn({ name: 'media_id', type: 'int', unsigned: true })
  mediaId!: number

  @Column({ type: 'int', default: 0 })
  position!: number

  @ManyToOne(() => Project, (project) => project.gallery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id', foreignKeyConstraintName: 'fk_project_media_project' })
  project!: Project

  @ManyToOne(() => MediaAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id', foreignKeyConstraintName: 'fk_project_media_media' })
  media!: MediaAsset
}
