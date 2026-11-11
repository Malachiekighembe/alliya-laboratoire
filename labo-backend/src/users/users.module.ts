import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CommonModule } from '../common/common.module.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UsersPublicController } from './users-public.controller.js';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UsersController, UsersPublicController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
