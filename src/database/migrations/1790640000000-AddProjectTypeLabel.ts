import { MigrationInterface, QueryRunner } from 'typeorm'

/** The card label ("Modular Kitchen") the website already shows, separate from the filter categories. */
export class AddProjectTypeLabel1790640000000 implements MigrationInterface {
  name = 'AddProjectTypeLabel1790640000000'

  public async up(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE `project` ADD `type_label` varchar(60) NULL AFTER `categories`')
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE `project` DROP COLUMN `type_label`')
  }
}
