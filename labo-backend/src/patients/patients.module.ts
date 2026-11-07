import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CommonModule } from '../common/common.module.js';
import { PatientCarnetsModule } from '../patient-carnets/patient-carnets.module.js';
import { PatientsService } from './patients.service.js';
import { PatientsController } from './patients.controller.js';

@Module({
  imports: [DatabaseModule, CommonModule, PatientCarnetsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}

