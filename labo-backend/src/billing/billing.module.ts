import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { BillingService } from './billing.service.js';
import { BillingController } from './billing.controller.js';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
