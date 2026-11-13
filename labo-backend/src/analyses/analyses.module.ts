import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AnalysesController } from './analyses.controller.js';
import { AnalysesService } from './analyses.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalysesController],
  providers: [AnalysesService],
  exports: [AnalysesService],
})
export class AnalysesModule {}