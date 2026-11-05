import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { COMMON } from '../common/index.js';
import { SyncService } from './sync.service.js';
import { SyncController } from './sync.controller.js';

@Module({
  imports: [PrismaModule, COMMON],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}