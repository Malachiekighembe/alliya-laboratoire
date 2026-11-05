import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { COMMON } from '../common/index.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';

@Module({
  imports: [PrismaModule, COMMON],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}