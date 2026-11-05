import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { UsersModule } from '../users/users.module.js';
import { VisitsService } from './visits.service.js';
import { VisitsController } from './visits.controller.js';

@Module({
  imports: [PrismaModule, CommonModule, PatientsModule, UsersModule],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
