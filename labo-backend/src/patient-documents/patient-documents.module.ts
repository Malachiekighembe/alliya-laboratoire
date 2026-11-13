import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { PatientDocumentsController } from './patient-documents.controller.js';
import { PatientDocumentsService } from './patient-documents.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PatientDocumentsController],
  providers: [PatientDocumentsService, MetricUtil],
  exports: [PatientDocumentsService],
})
export class PatientDocumentsModule {}