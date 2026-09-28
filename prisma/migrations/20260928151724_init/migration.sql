-- CreateTable
CREATE TABLE `admin_user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(120) NOT NULL,
    `initials` CHAR(2) NOT NULL,
    `role` ENUM('owner') NOT NULL DEFAULT 'owner',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_session` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip_hash` CHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_session_token_hash_key`(`token_hash`),
    INDEX `admin_session_admin_user_id_idx`(`admin_user_id`),
    INDEX `admin_session_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiry` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `reference_code` CHAR(10) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `email` VARCHAR(190) NULL,
    `service_label` VARCHAR(120) NOT NULL,
    `budget_label` VARCHAR(60) NULL,
    `message` TEXT NULL,
    `source` ENUM('website_form', 'consultation_modal', 'instagram', 'referral', 'google', 'whatsapp', 'other') NOT NULL,
    `is_handled` BOOLEAN NOT NULL DEFAULT false,
    `handled_at` DATETIME(3) NULL,
    `notified_at` DATETIME(3) NULL,
    `ip_hash` CHAR(64) NULL,
    `user_agent` VARCHAR(255) NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enquiry_reference_code_key`(`reference_code`),
    INDEX `enquiry_is_handled_submitted_at_idx`(`is_handled`, `submitted_at` DESC),
    INDEX `enquiry_submitted_at_idx`(`submitted_at` DESC),
    INDEX `enquiry_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_asset` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `storage_key` VARCHAR(255) NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `mime` VARCHAR(64) NOT NULL,
    `byte_size` INTEGER UNSIGNED NOT NULL,
    `width` INTEGER UNSIGNED NOT NULL,
    `height` INTEGER UNSIGNED NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `lqip_color` CHAR(7) NULL,
    `status` ENUM('processing', 'ready', 'failed') NOT NULL DEFAULT 'processing',
    `derivatives` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `media_asset_storage_key_key`(`storage_key`),
    INDEX `media_asset_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `short_description` VARCHAR(500) NOT NULL,
    `full_description` TEXT NULL,
    `inclusions` JSON NOT NULL,
    `image_id` INTEGER UNSIGNED NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_slug_key`(`slug`),
    INDEX `service_is_published_display_order_idx`(`is_published`, `display_order`),
    INDEX `service_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `categories` JSON NOT NULL,
    `location` VARCHAR(120) NOT NULL,
    `area_label` VARCHAR(60) NULL,
    `year_label` VARCHAR(10) NULL,
    `short_description` VARCHAR(500) NOT NULL,
    `full_description` TEXT NULL,
    `cover_id` INTEGER UNSIGNED NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `published_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_slug_key`(`slug`),
    INDEX `project_is_published_display_order_idx`(`is_published`, `display_order`),
    INDEX `project_is_featured_is_published_display_order_idx`(`is_featured`, `is_published`, `display_order`),
    INDEX `project_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_media` (
    `project_id` INTEGER UNSIGNED NOT NULL,
    `media_id` INTEGER UNSIGNED NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `project_media_project_id_position_idx`(`project_id`, `position`),
    PRIMARY KEY (`project_id`, `media_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonial` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `customer_name` VARCHAR(120) NOT NULL,
    `attribution` VARCHAR(160) NULL,
    `quote` TEXT NOT NULL,
    `photo_id` INTEGER UNSIGNED NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `testimonial_is_published_display_order_idx`(`is_published`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `website_url` VARCHAR(255) NULL,
    `logo_id` INTEGER UNSIGNED NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `brand_is_published_display_order_idx`(`is_published`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `faq_is_published_display_order_idx`(`is_published`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_setting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `phone` VARCHAR(32) NOT NULL,
    `phone_href` VARCHAR(40) NOT NULL,
    `whatsapp_href` VARCHAR(255) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `address_line1` VARCHAR(160) NOT NULL,
    `address_line2` VARCHAR(160) NULL,
    `address_line3` VARCHAR(160) NULL,
    `hours` VARCHAR(120) NOT NULL,
    `maps_url` VARCHAR(500) NULL,
    `instagram_url` VARCHAR(255) NULL,
    `facebook_url` VARCHAR(255) NULL,
    `youtube_url` VARCHAR(255) NULL,
    `stat_projects` INTEGER NOT NULL DEFAULT 0,
    `stat_families` INTEGER NOT NULL DEFAULT 0,
    `stat_concepts` INTEGER NOT NULL DEFAULT 0,
    `stat_years` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_session` ADD CONSTRAINT `admin_session_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `service_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `media_asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_cover_id_fkey` FOREIGN KEY (`cover_id`) REFERENCES `media_asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_media` ADD CONSTRAINT `project_media_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_media` ADD CONSTRAINT `project_media_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media_asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonial` ADD CONSTRAINT `testimonial_photo_id_fkey` FOREIGN KEY (`photo_id`) REFERENCES `media_asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brand` ADD CONSTRAINT `brand_logo_id_fkey` FOREIGN KEY (`logo_id`) REFERENCES `media_asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
