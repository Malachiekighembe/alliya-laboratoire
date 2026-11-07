import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CommonModule } from '../common/common.module.js';
import { PatientCarnetsService } from './patient-carnets.service.js';
import { PatientCarnetsController } from './patient-carnets.controller.js';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [PatientCarnetsController],
  providers: [PatientCarnetsService],
  exports: [PatientCarnetsService],
})
export class PatientCarnetsModule {}
