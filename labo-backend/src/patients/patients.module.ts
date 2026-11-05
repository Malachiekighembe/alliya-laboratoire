import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { PatientsService } from './patients.service.js';
import { PatientsController } from './patients.controller.js';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
