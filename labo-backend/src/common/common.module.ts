import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from '../database/database.module.js';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { LaboratoryAccessGuard } from './guards/laboratory-access.guard.js';

// Interceptors
import { AuditInterceptor } from './interceptors/audit.interceptor.js';

// Filters
import { HttpExceptionFilter } from './filters/http-exception.filter.js';

// Pipes
import { GlobalValidationPipe } from './pipes/validation.pipe.js';

// Utils
import { PasswordUtil } from './utils/password.util.js';
import { UuidUtil } from './utils/uuid.util.js';
import { MetricUtil } from './utils/metric.util.js';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    LaboratoryAccessGuard,
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    PasswordUtil,
    UuidUtil,
    MetricUtil,
  ],
  exports: [
    JwtAuthGuard,
    PermissionsGuard,
    LaboratoryAccessGuard,
    PasswordUtil,
    UuidUtil,
    MetricUtil,
    DatabaseModule,
  ],
})
export class CommonModule {}
export { CommonModule as COMMON };

