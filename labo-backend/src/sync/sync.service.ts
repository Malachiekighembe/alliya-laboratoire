import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async push(laboratory_id: string, events: any[]) {
    const results = [];
    for (const event of events) {
      const created = await this.prisma.sync_events.create({
        data: { laboratory_id, aggregate_type: event.aggregate_type, aggregate_id: event.aggregate_id, event_type: event.event_type, payload: event.payload },
      });
      results.push(created);
    }
    return results;
  }

  async pull(laboratory_id: string, lastSyncAt?: string) {
    const where: any = { laboratory_id, status: 'pending' };
    if (lastSyncAt) where.created_at = { gte: new Date(lastSyncAt) };
    return this.prisma.sync_events.findMany({ where, orderBy: { created_at: 'asc' } });
  }

  async markProcessed(id: string, laboratory_id: string) {
    return this.prisma.sync_events.update({ where: { id }, data: { status: 'processed', processed_at: new Date() } });
  }
}