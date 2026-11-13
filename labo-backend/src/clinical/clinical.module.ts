import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ClinicalController } from './clinical.controller.js';
import { ClinicalService } from './clinical.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ClinicalController],
  providers: [ClinicalService],
  exports: [ClinicalService],
})
export class ClinicalModule {}