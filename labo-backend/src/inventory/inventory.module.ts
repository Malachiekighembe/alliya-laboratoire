import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { COMMON } from '../common/index.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [PrismaModule, COMMON],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}