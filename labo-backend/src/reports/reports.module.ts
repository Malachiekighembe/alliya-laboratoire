import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { COMMON } from '../common/index.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';

@Module({
  imports: [DatabaseModule, COMMON],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
