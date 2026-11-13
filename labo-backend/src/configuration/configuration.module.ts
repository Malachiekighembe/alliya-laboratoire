import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ConfigurationController } from './configuration.controller.js';
import { ConfigurationService } from './configuration.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}