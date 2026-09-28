import { MigrationInterface, QueryRunner } from 'typeorm'

/* ── Initial schema ────────────────────────────────────────────────────────
   Eleven tables, per the implementation plan. Hand-written to match the
   entities exactly; `npm run migration:generate` against a migrated
   database must report no changes — that is the check that these agree.
   ------------------------------------------------------------------------ */

const TABLE = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
const TS = 'datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)'
const TS_UPD = 'datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)'

export class Init1790553600000 implements MigrationInterface {
  name = 'Init1790553600000'

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE \`admin_user\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`email\` varchar(190) NOT NULL,
      \`password_hash\` varchar(255) NOT NULL,
      \`display_name\` varchar(120) NOT NULL,
      \`initials\` char(2) NOT NULL,
      \`role\` enum('owner') NOT NULL DEFAULT 'owner',
      \`is_active\` tinyint NOT NULL DEFAULT 1,
      \`last_login_at\` datetime(3) NULL,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      UNIQUE INDEX \`uq_admin_user_email\` (\`email\`),
      PRIMARY KEY (\`id\`)
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`admin_session\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`admin_user_id\` int unsigned NOT NULL,
      \`token_hash\` char(64) NOT NULL,
      \`expires_at\` datetime(3) NOT NULL,
      \`revoked_at\` datetime(3) NULL,
      \`user_agent\` varchar(255) NULL,
      \`ip_hash\` char(64) NULL,
      \`created_at\` ${TS},
      INDEX \`idx_admin_session_user\` (\`admin_user_id\`),
      UNIQUE INDEX \`uq_admin_session_token_hash\` (\`token_hash\`),
      INDEX \`idx_admin_session_expires\` (\`expires_at\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`fk_admin_session_user\` FOREIGN KEY (\`admin_user_id\`)
        REFERENCES \`admin_user\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`enquiry\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`reference_code\` char(10) NOT NULL,
      \`name\` varchar(120) NOT NULL,
      \`phone\` varchar(32) NOT NULL,
      \`email\` varchar(190) NULL,
      \`service_label\` varchar(120) NOT NULL,
      \`budget_label\` varchar(60) NULL,
      \`message\` text NULL,
      \`source\` enum('website_form','consultation_modal','instagram','referral','google','whatsapp','other') NOT NULL,
      \`is_handled\` tinyint NOT NULL DEFAULT 0,
      \`handled_at\` datetime(3) NULL,
      \`notified_at\` datetime(3) NULL,
      \`ip_hash\` char(64) NULL,
      \`user_agent\` varchar(255) NULL,
      \`submitted_at\` ${TS},
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      UNIQUE INDEX \`uq_enquiry_reference_code\` (\`reference_code\`),
      INDEX \`idx_enquiry_phone\` (\`phone\`),
      INDEX \`idx_enquiry_submitted\` (\`submitted_at\`),
      INDEX \`idx_enquiry_handled_submitted\` (\`is_handled\`, \`submitted_at\`),
      PRIMARY KEY (\`id\`)
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`media_asset\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`storage_key\` varchar(255) NOT NULL,
      \`original_filename\` varchar(255) NOT NULL,
      \`mime\` varchar(64) NOT NULL,
      \`byte_size\` int unsigned NOT NULL,
      \`width\` int unsigned NOT NULL,
      \`height\` int unsigned NOT NULL,
      \`alt_text\` varchar(255) NULL,
      \`lqip_color\` char(7) NULL,
      \`status\` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
      \`derivatives\` json NULL,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      UNIQUE INDEX \`uq_media_asset_storage_key\` (\`storage_key\`),
      INDEX \`idx_media_asset_status\` (\`status\`),
      PRIMARY KEY (\`id\`)
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`service\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`slug\` varchar(120) NOT NULL,
      \`name\` varchar(120) NOT NULL,
      \`short_description\` varchar(500) NOT NULL,
      \`full_description\` text NULL,
      \`inclusions\` json NOT NULL,
      \`image_id\` int unsigned NULL,
      \`is_published\` tinyint NOT NULL DEFAULT 0,
      \`display_order\` int NOT NULL DEFAULT 0,
      \`deleted_at\` datetime(3) NULL,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      UNIQUE INDEX \`uq_service_slug\` (\`slug\`),
      INDEX \`idx_service_deleted\` (\`deleted_at\`),
      INDEX \`idx_service_published_order\` (\`is_published\`, \`display_order\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`fk_service_image\` FOREIGN KEY (\`image_id\`)
        REFERENCES \`media_asset\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`project\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`slug\` varchar(120) NOT NULL,
      \`title\` varchar(160) NOT NULL,
      \`categories\` json NOT NULL,
      \`location\` varchar(120) NOT NULL,
      \`area_label\` varchar(60) NULL,
      \`year_label\` varchar(10) NULL,
      \`short_description\` varchar(500) NOT NULL,
      \`full_description\` text NULL,
      \`cover_id\` int unsigned NULL,
      \`is_featured\` tinyint NOT NULL DEFAULT 0,
      \`is_published\` tinyint NOT NULL DEFAULT 0,
      \`display_order\` int NOT NULL DEFAULT 0,
      \`published_at\` datetime(3) NULL,
      \`deleted_at\` datetime(3) NULL,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      UNIQUE INDEX \`uq_project_slug\` (\`slug\`),
      INDEX \`idx_project_deleted\` (\`deleted_at\`),
      INDEX \`idx_project_featured\` (\`is_featured\`, \`is_published\`, \`display_order\`),
      INDEX \`idx_project_published_order\` (\`is_published\`, \`display_order\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`fk_project_cover\` FOREIGN KEY (\`cover_id\`)
        REFERENCES \`media_asset\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`project_media\` (
      \`project_id\` int unsigned NOT NULL,
      \`media_id\` int unsigned NOT NULL,
      \`position\` int NOT NULL DEFAULT 0,
      INDEX \`idx_project_media_position\` (\`project_id\`, \`position\`),
      PRIMARY KEY (\`project_id\`, \`media_id\`),
      CONSTRAINT \`fk_project_media_project\` FOREIGN KEY (\`project_id\`)
        REFERENCES \`project\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
      CONSTRAINT \`fk_project_media_media\` FOREIGN KEY (\`media_id\`)
        REFERENCES \`media_asset\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`testimonial\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`customer_name\` varchar(120) NOT NULL,
      \`attribution\` varchar(160) NULL,
      \`quote\` text NOT NULL,
      \`photo_id\` int unsigned NULL,
      \`is_published\` tinyint NOT NULL DEFAULT 0,
      \`display_order\` int NOT NULL DEFAULT 0,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      INDEX \`idx_testimonial_published_order\` (\`is_published\`, \`display_order\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`fk_testimonial_photo\` FOREIGN KEY (\`photo_id\`)
        REFERENCES \`media_asset\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`brand\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(120) NOT NULL,
      \`website_url\` varchar(255) NULL,
      \`logo_id\` int unsigned NULL,
      \`is_published\` tinyint NOT NULL DEFAULT 0,
      \`display_order\` int NOT NULL DEFAULT 0,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      INDEX \`idx_brand_published_order\` (\`is_published\`, \`display_order\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`fk_brand_logo\` FOREIGN KEY (\`logo_id\`)
        REFERENCES \`media_asset\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`faq\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`question\` varchar(255) NOT NULL,
      \`answer\` text NOT NULL,
      \`is_published\` tinyint NOT NULL DEFAULT 0,
      \`display_order\` int NOT NULL DEFAULT 0,
      \`created_at\` ${TS},
      \`updated_at\` ${TS_UPD},
      INDEX \`idx_faq_published_order\` (\`is_published\`, \`display_order\`),
      PRIMARY KEY (\`id\`)
    ) ${TABLE}`)

    await q.query(`CREATE TABLE \`site_setting\` (
      \`id\` int NOT NULL DEFAULT 1,
      \`phone\` varchar(32) NOT NULL,
      \`phone_href\` varchar(40) NOT NULL,
      \`whatsapp_href\` varchar(255) NOT NULL,
      \`email\` varchar(190) NOT NULL,
      \`address_line1\` varchar(160) NOT NULL,
      \`address_line2\` varchar(160) NULL,
      \`address_line3\` varchar(160) NULL,
      \`hours\` varchar(120) NOT NULL,
      \`maps_url\` varchar(500) NULL,
      \`instagram_url\` varchar(255) NULL,
      \`facebook_url\` varchar(255) NULL,
      \`youtube_url\` varchar(255) NULL,
      \`stat_projects\` int NOT NULL DEFAULT 0,
      \`stat_families\` int NOT NULL DEFAULT 0,
      \`stat_concepts\` int NOT NULL DEFAULT 0,
      \`stat_years\` int NOT NULL DEFAULT 0,
      \`updated_at\` ${TS_UPD},
      PRIMARY KEY (\`id\`)
    ) ${TABLE}`)
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const table of [
      'site_setting',
      'faq',
      'brand',
      'testimonial',
      'project_media',
      'project',
      'service',
      'media_asset',
      'enquiry',
      'admin_session',
      'admin_user',
    ]) {
      await q.query(`DROP TABLE \`${table}\``)
    }
  }
}
