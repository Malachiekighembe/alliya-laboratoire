import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CommonModule } from '../common/common.module.js';
import { ExaminationsService } from './examinations.service.js';
import { ExaminationsController } from './examinations.controller.js';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}

