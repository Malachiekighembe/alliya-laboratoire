import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CommonModule } from '../common/common.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { VisitsModule } from '../visits/visits.module.js';
import { UsersModule } from '../users/users.module.js';
import { SpecimensService } from './specimens.service.js';
import { SpecimensController } from './specimens.controller.js';

@Module({
  imports: [DatabaseModule, CommonModule, PatientsModule, VisitsModule, UsersModule],
  controllers: [SpecimensController],
  providers: [SpecimensService],
  exports: [SpecimensService],
})
export class SpecimensModule {}

