import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminSettingsController, PublicSettingsController } from './settings.controller'
import { SettingsService } from './settings.service'
import { SiteSetting } from './site-setting.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SiteSetting])],
  controllers: [PublicSettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
