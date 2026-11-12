import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CacheService } from '../cache/cache.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  private isSuperAdmin(user: any): boolean {
    return !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
  }

  async findAll(user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const cacheKey = superAdmin ? 'subs:all:super' : `subs:all:${user?.laboratory_id || 'none'}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    const data = await this.prisma.subscriptions.findMany({ where, orderBy: { created_at: 'desc' } });
    await this.cache.set(cacheKey, data, 60);
    return data;
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
    if (existing) throw new ConflictException('Un abonnement existe déjà pour ce laboratoire');

    const created = await this.prisma.subscriptions.create({
      data: {
        laboratory_id: dto.laboratory_id,
        plan: dto.plan,
        plan_name: dto.plan_name || dto.plan,
        status: dto.status || 'trial',
        started_at: dto.started_at ? new Date(dto.started_at) : new Date(),
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
        price_monthly: dto.price_monthly ?? 0,
        currency: dto.currency || 'USD',
        max_users: dto.max_users ?? null,
        max_patients: dto.max_patients ?? null,
        max_analyses: dto.max_analyses ?? null,
        auto_renew: dto.auto_renew !== false,
      },
    });
    await this.cache.delByPattern('subs:*');
    await this.cache.delByPattern('labs:*');
    return created;
  }

  async update(id: string, dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id };
    if (!superAdmin && user?.laboratory_id) {
      where.laboratory_id = user.laboratory_id;
    }

    const existing = await this.prisma.subscriptions.findFirst({ where });
    if (!existing) throw new NotFoundException('Abonnement introuvable');

    const data: any = {};
    if (dto.plan !== undefined) data.plan = dto.plan;
    if (dto.plan_name !== undefined) data.plan_name = dto.plan_name ?? dto.plan ?? existing.plan_name;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.started_at !== undefined) data.started_at = dto.started_at ? new Date(dto.started_at) : null;
    if (dto.expires_at !== undefined) data.expires_at = dto.expires_at ? new Date(dto.expires_at) : null; // null = durée indéterminée
    if (dto.price_monthly !== undefined) data.price_monthly = dto.price_monthly === '' || dto.price_monthly === null ? null : Number(dto.price_monthly);
    if (dto.currency !== undefined) data.currency = dto.currency || existing.currency || 'USD';
    if (dto.max_users !== undefined) data.max_users = dto.max_users === '' || dto.max_users === null ? null : Number(dto.max_users);
    if (dto.max_patients !== undefined) data.max_patients = dto.max_patients === '' || dto.max_patients === null ? null : Number(dto.max_patients);
    if (dto.max_analyses !== undefined) data.max_analyses = dto.max_analyses === '' || dto.max_analyses === null ? null : Number(dto.max_analyses);
    if (dto.auto_renew !== undefined) data.auto_renew = !!dto.auto_renew;

    const updated = await this.prisma.subscriptions.update({ where: { id }, data });
    await this.cache.delByPattern('subs:*');
    await this.cache.delByPattern('labs:*');
    return updated;
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
    await this.cache.delByPattern('subs:*');
    await this.cache.delByPattern('labs:*');
  }
}
