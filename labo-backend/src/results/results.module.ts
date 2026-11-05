import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { SpecimensModule } from '../specimens/specimens.module.js';
import { ExaminationsModule } from '../examinations/examinations.module.js';
import { UsersModule } from '../users/users.module.js';
import { ResultsService } from './results.service.js';
import { ResultsController } from './results.controller.js';

@Module({
  imports: [PrismaModule, CommonModule, SpecimensModule, ExaminationsModule, UsersModule],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
