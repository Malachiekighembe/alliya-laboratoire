import { Module } from '@nestjs/common';
import { LaboratoriesController } from './laboratories.controller.js';
import { LaboratoriesService } from './laboratories.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LaboratoriesController],
  providers: [LaboratoriesService],
  exports: [LaboratoriesService],
})
export class LaboratoriesModule {}
