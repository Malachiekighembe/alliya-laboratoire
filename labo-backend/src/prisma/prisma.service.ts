import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('PrismaService');

/**
 * Service Prisma pour PostgreSQL avec support de synchronisation
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      logger.log('✅ PrismaService connected to PostgreSQL database');
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    logger.log('✅ PrismaService disconnected from PostgreSQL');
  }

  // Méthodes de synchronisation avec Isar
  async getPendingSync(table: string, limit = 100) {
    try {
      switch (table) {
        case 'patients':
          return this.patients.findMany({
            where: { 
              OR: [
                { sync_status: 'pending' },
                { sync_status: 'error' },
                { is_local_only: true }
              ]
            },
            take: limit
          });
        case 'users':
          return this.users.findMany({
            where: { 
              OR: [
                { sync_status: 'pending' },
                { sync_status: 'error' },
                { is_local_only: true }
              ]
            },
            take: limit
          });
        case 'laboratories':
          return this.laboratories.findMany({
            where: { 
              OR: [
                { sync_status: 'pending' },
                { sync_status: 'error' },
                { is_local_only: true }
              ]
            },
            take: limit
          });
        default:
          logger.warn(`Sync not implemented for table: ${table}`);
          return [];
      }
    } catch (error) {
      logger.error(`Error getting pending sync for ${table}:`, error);
      return [];
    }
  }

  async markAsSynced(table: string, id: string) {
    try {
      switch (table) {
        case 'patients':
          return this.patients.update({
            where: { id },
            data: { 
              sync_status: 'synced',
              last_synced_at: new Date(),
              is_local_only: false
            }
          });
        case 'users':
          return this.users.update({
            where: { id },
            data: { 
              sync_status: 'synced',
              last_synced_at: new Date(),
              is_local_only: false
            }
          });
        case 'laboratories':
          return this.laboratories.update({
            where: { id },
            data: { 
              sync_status: 'synced',
              last_synced_at: new Date(),
              is_local_only: false
            }
          });
        default:
          logger.warn(`Sync not implemented for table: ${table}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error marking as synced for ${table} ${id}:`, error);
      return null;
    }
  }

  async createLocalOnly(table: string, data: any) {
    try {
      const syncData = {
        ...data,
        sync_status: 'pending',
        sync_version: 1,
        is_local_only: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      switch (table) {
        case 'patients':
          return this.patients.create({ data: syncData });
        case 'users':
          return this.users.create({ data: syncData });
        case 'laboratories':
          return this.laboratories.create({ data: syncData });
        default:
          logger.warn(`Local creation not implemented for table: ${table}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error creating local record for ${table}:`, error);
      return null;
    }
  }

  // Méthodes utilitaires pour la gestion des données
  async getLaboratoryStats(laboratoryId: string) {
    try {
      const [
        totalPatients,
        activePatients,
        totalVisits,
        pendingOrders,
        totalResults
      ] = await Promise.all([
        this.patients.count({ where: { laboratory_id: laboratoryId } }),
        this.patients.count({ where: { laboratory_id: laboratoryId, is_active: true } }),
        this.visits.count({ where: { laboratory_id: laboratoryId } }),
        this.orders.count({ where: { laboratory_id: laboratoryId, status: 'pending' } }),
        this.results.count({ where: { laboratory_id: laboratoryId } })
      ]);

      return {
        totalPatients,
        activePatients,
        totalVisits,
        pendingOrders,
        totalResults
      };
    } catch (error) {
      logger.error('Error getting laboratory stats:', error);
      return {
        totalPatients: 0,
        activePatients: 0,
        totalVisits: 0,
        pendingOrders: 0,
        totalResults: 0
      };
    }
  }

  // Méthodes de sauvegarde et restauration
  async backupData(laboratoryId: string, tables: string[] = ['patients', 'users', 'laboratories']) {
    try {
      const backup: any = {};
      
      for (const table of tables) {
        switch (table) {
          case 'patients':
            backup.patients = await this.patients.findMany({
              where: { laboratory_id: laboratoryId }
            });
            break;
          case 'users':
            backup.users = await this.users.findMany({
              where: { laboratory_id: laboratoryId }
            });
            break;
          case 'laboratories':
            backup.laboratories = await this.laboratories.findMany({
              where: { id: laboratoryId }
            });
            break;
        }
      }
      
      logger.log(`✅ Backup created for laboratory ${laboratoryId}`);
      return backup;
    } catch (error) {
      logger.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreData(laboratoryId: string, backup: any) {
    try {
      for (const [table, data] of Object.entries(backup)) {
        if (Array.isArray(data) && data.length > 0) {
          switch (table) {
            case 'patients':
              for (const patient of data) {
                await this.patients.upsert({
                  where: { id: patient.id },
                  update: patient,
                  create: patient
                });
              }
              break;
            case 'users':
              for (const user of data) {
                await this.users.upsert({
                  where: { id: user.id },
                  update: user,
                  create: user
                });
              }
              break;
            case 'laboratories':
              for (const lab of data) {
                await this.laboratories.upsert({
                  where: { id: lab.id },
                  update: lab,
                  create: lab
                });
              }
              break;
          }
        }
      }
      
      logger.log(`✅ Data restored for laboratory ${laboratoryId}`);
    } catch (error) {
      logger.error('Error restoring data:', error);
      throw error;
    }
  }
}
