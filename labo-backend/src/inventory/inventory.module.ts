import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { COMMON } from '../common/index.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [DatabaseModule, COMMON],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
