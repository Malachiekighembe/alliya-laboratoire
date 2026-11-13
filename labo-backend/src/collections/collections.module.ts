import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CollectionsController } from './collections.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}