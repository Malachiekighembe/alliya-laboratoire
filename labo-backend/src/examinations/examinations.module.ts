import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { ExaminationsService } from './examinations.service.js';
import { ExaminationsController } from './examinations.controller.js';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
