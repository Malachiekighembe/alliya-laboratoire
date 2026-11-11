import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service.js';
import { CacheService } from '../cache/cache.service.js';

@Injectable()
export class LaboratoriesService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  private isSuperAdmin(user: any): boolean {
    return !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
  }

  async findAll(user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const cacheKey = superAdmin ? 'labs:all:super' : `labs:all:${user?.laboratory_id || 'none'}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: any = { deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const labs = await this.prisma.laboratories.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(labs.map(async (lab: any) => {
      const [subscription, usersCount, patientsCount, analysesCount, resultsCount, visitsCount] = await Promise.all([
        this.prisma.subscriptions.findFirst({ where: { laboratory_id: lab.id } }),
        this.prisma.users.count({ where: { laboratory_id: lab.id, deleted_at: null } }),
        this.prisma.patients.count({ where: { laboratory_id: lab.id, deleted_at: null } }),
        this.prisma.results.count({ where: { laboratory_id: lab.id } }),
        this.prisma.results.count({ where: { laboratory_id: lab.id, status: 'validated' } }),
        this.prisma.visits.count({ where: { laboratory_id: lab.id } }),
      ]);

      return {
        ...lab,
        subscription,
        stats: {
          laboratory_id: lab.id,
          users_count: usersCount,
          patients_count: patientsCount,
          analyses_count: analysesCount,
          results_count: resultsCount,
          visits_count: visitsCount,
          last_activity: null,
        },
      };
    }));

    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async findById(id: string, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id, deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const lab = await this.prisma.laboratories.findFirst({ where });
    if (!lab) throw new NotFoundException('Laboratoire introuvable');

    const subscription = await this.prisma.subscriptions.findFirst({
      where: { laboratory_id: lab.id },
    });
    const users = await this.prisma.users.findMany({
      where: { laboratory_id: lab.id, deleted_at: null },
      select: { id: true, first_name: true, last_name: true, email: true, phone: true, roles: true, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    return { ...lab, subscription, users, stats: null };
  }

  async create(dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    if (!superAdmin) {
      throw new NotFoundException('Accès réservé au super administrateur');
    }

    const code = dto.code || `LAB-${Date.now().toString().slice(-6)}`;
    const name = dto.name || 'Nouveau laboratoire';
    const slug = dto.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `lab-${Date.now()}`;

    const existing = await this.prisma.laboratories.findFirst({ where: { code } });
    if (existing) throw new Error('Un laboratoire avec ce code existe déjà');

    const lab = await this.prisma.laboratories.create({
      data: {
        code,
        name,
        slug,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        is_active: dto.is_active !== false,
      },
    });

    let adminUser: any = null;
    const admin = dto.admin;
    if (admin && (admin.email || admin.first_name || admin.last_name || admin.password)) {
      const password_hash = admin.password ? await bcrypt.hash(admin.password, 10) : null;
      const roles: string[] = Array.isArray(admin.roles) && admin.roles.length ? admin.roles : ['admin'];
      adminUser = await this.prisma.users.create({
        data: {
          laboratory_id: lab.id,
          email: admin.email || null,
          password_hash,
          first_name: admin.first_name || '',
          last_name: admin.last_name || '',
          phone: admin.phone || null,
          roles,
          permissions: [],
          is_active: admin.is_active !== false,
        },
      });
      if (adminUser) {
        const { password_hash: _ph, ...safe } = adminUser as any;
        adminUser = safe;
      }
    }

    await this.cache.delByPattern('labs:*');
    return { ...lab, admin: adminUser };
  }

  async update(id: string, dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id, deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const existing = await this.prisma.laboratories.findFirst({ where });
    if (!existing) throw new NotFoundException('Laboratoire introuvable');

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.prisma.laboratories.update({ where: { id }, data });
    await this.cache.delByPattern('labs:*');
    return updated;
  }

  async remove(id: string, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id, deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const existing = await this.prisma.laboratories.findFirst({ where });
    if (!existing) throw new NotFoundException('Laboratoire introuvable');

    await this.prisma.laboratories.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
    await this.cache.delByPattern('labs:*');
  }
}
