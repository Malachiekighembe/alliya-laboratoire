import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { VisitsModule } from './visits/visits.module.js';
import { ExaminationsModule } from './examinations/examinations.module.js';
import { SpecimensModule } from './specimens/specimens.module.js';
import { ResultsModule } from './results/results.module.js';
import { BillingModule } from './billing/billing.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { LaboratoriesModule } from './laboratories/laboratories.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { createConfiguration, validateEnvironment } from './config/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [createConfiguration],
      validate: (env: Record<string, unknown>) => {
        const { value } = validateEnvironment(env);
        return value as Record<string, unknown>;
      },
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    VisitsModule,
    ExaminationsModule,
    SpecimensModule,
    ResultsModule,
    BillingModule,
    InventoryModule,
    ReportsModule,
    LaboratoriesModule,
    SubscriptionsModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

