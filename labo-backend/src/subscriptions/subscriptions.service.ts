import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: DatabaseService) {}

  private isSuperAdmin(user: any): boolean {
    return !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
  }

  async findAll(user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = {};
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    return this.prisma.subscriptions.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findById(id: string, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id };
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    const sub = await this.prisma.subscriptions.findFirst({ where });
    if (!sub) throw new NotFoundException('Abonnement introuvable');
    return sub;
  }

  async findByLaboratory(laboratoryId: string, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    if (!superAdmin && user?.laboratory_id && user.laboratory_id !== laboratoryId) {
      throw new NotFoundException('Abonnement introuvable');
    }

    return this.prisma.subscriptions.findFirst({
      where: { laboratory_id: laboratoryId },
    });
  }

  async create(dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    if (!superAdmin) {
      throw new NotFoundException('Accès réservé au super administrateur');
    }

    const existing = await this.prisma.subscriptions.findFirst({
      where: { laboratory_id: dto.laboratory_id },
    });
    if (existing) throw new Error('Un abonnement existe déjà pour ce laboratoire');

    return this.prisma.subscriptions.create({
      data: {
        laboratory_id: dto.laboratory_id,
        plan: dto.plan,
        plan_name: dto.plan_name || dto.plan,
        status: dto.status || 'trial',
        started_at: dto.started_at ? new Date(dto.started_at) : new Date(),
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
        price_monthly: dto.price_monthly ?? 0,
        currency: dto.currency || 'EUR',
        max_users: dto.max_users ?? null,
        max_patients: dto.max_patients ?? null,
        max_analyses: dto.max_analyses ?? null,
        auto_renew: dto.auto_renew !== false,
      },
    });
  }

  async update(id: string, dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id };
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    const existing = await this.prisma.subscriptions.findFirst({ where });
    if (!existing) throw new NotFoundException('Abonnement introuvable');

    return this.prisma.subscriptions.update({
      where: { id },
      data: {
        plan: dto.plan,
        plan_name: dto.plan_name,
        status: dto.status,
        started_at: dto.started_at ? new Date(dto.started_at) : undefined,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
        price_monthly: dto.price_monthly,
        currency: dto.currency,
        max_users: dto.max_users,
        max_patients: dto.max_patients,
        max_analyses: dto.max_analyses,
        auto_renew: dto.auto_renew,
      },
    });
  }

  async remove(id: string, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id };
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    const existing = await this.prisma.subscriptions.findFirst({ where });
    if (!existing) throw new NotFoundException('Abonnement introuvable');

    await this.prisma.subscriptions.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
