import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/extension';

const logger = new Logger('PrismaService');

/**
 * Service Prisma gerant la connexion a la base de donnees PostgreSQL.
 * Active le logging des requetes en mode debug.
 * Applique un middleware soft-delete optionnel pour les modeles possedant deleted_at.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
        ...(process.env.PRISMA_LOG === 'debug'
          ? ([
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'info' },
            ] as any)
          : []),
      ],
    });

    this.$use(async (params: any, next: any) => {
      const modelsWithDeletedAt = [
        'laboratories',
        'users',
        'patients',
        'practitioners',
        'results',
      ];

      if (modelsWithDeletedAt.includes(params.model)) {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args = {
            ...params.args,
            data: { deleted_at: new Date() },
          };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args = {
            ...params.args,
            data: { deleted_at: new Date() },
          };
        }
        if (
          params.action === 'findUnique' ||
          params.action === 'findFirst' ||
          params.action === 'findMany' ||
          params.action === 'count'
        ) {
          const where = params.args?.where ?? {};
          params.args = {
            ...params.args,
            where: {
              ...where,
              deleted_at: where.deleted_at ?? null,
            },
          };
        }
      }
      return next(params);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
