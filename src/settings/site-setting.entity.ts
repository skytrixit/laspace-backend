import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

/** Exactly one row, id = 1, enforced by the settings service (upsert only). */
@Entity('site_setting')
export class SiteSetting {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number

  @Column({ type: 'varchar', length: 32 })
  phone!: string

  @Column({ name: 'phone_href', type: 'varchar', length: 40 })
  phoneHref!: string

  @Column({ name: 'whatsapp_href', type: 'varchar', length: 255 })
  whatsappHref!: string

  @Column({ type: 'varchar', length: 190 })
  email!: string

  @Column({ name: 'address_line1', type: 'varchar', length: 160 })
  addressLine1!: string

  @Column({ name: 'address_line2', type: 'varchar', length: 160, nullable: true })
  addressLine2!: string | null

  @Column({ name: 'address_line3', type: 'varchar', length: 160, nullable: true })
  addressLine3!: string | null

  @Column({ type: 'varchar', length: 120 })
  hours!: string

  @Column({ name: 'maps_url', type: 'varchar', length: 500, nullable: true })
  mapsUrl!: string | null

  @Column({ name: 'instagram_url', type: 'varchar', length: 255, nullable: true })
  instagramUrl!: string | null

  @Column({ name: 'facebook_url', type: 'varchar', length: 255, nullable: true })
  facebookUrl!: string | null

  @Column({ name: 'youtube_url', type: 'varchar', length: 255, nullable: true })
  youtubeUrl!: string | null

  @Column({ name: 'stat_projects', type: 'int', default: 0 })
  statProjects!: number

  @Column({ name: 'stat_families', type: 'int', default: 0 })
  statFamilies!: number

  @Column({ name: 'stat_concepts', type: 'int', default: 0 })
  statConcepts!: number

  @Column({ name: 'stat_years', type: 'int', default: 0 })
  statYears!: number

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
