import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class LaboratoriesService {
  constructor(private readonly prisma: DatabaseService) {}

  private isSuperAdmin(user: any): boolean {
    return !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
  }

  async findAll(user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const labs = await this.prisma.laboratories.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const result = [];
    for (const lab of labs) {
      const subscription = await this.prisma.subscriptions.findFirst({
        where: { laboratory_id: lab.id },
      });

      const [usersCount, patientsCount, analysesCount, resultsCount, visitsCount] = await Promise.all([
        this.prisma.users.count({ where: { laboratory_id: lab.id, deleted_at: null } }),
        this.prisma.patients.count({ where: { laboratory_id: lab.id, deleted_at: null } }),
        this.prisma.results.count({ where: { laboratory_id: lab.id } }),
        this.prisma.results.count({ where: { laboratory_id: lab.id, status: 'validated' } }),
        this.prisma.visits.count({ where: { laboratory_id: lab.id } }),
      ]);

      result.push({
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
      });
    }

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

    return { ...lab, subscription, stats: null };
  }

  async create(dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    if (!superAdmin) {
      throw new NotFoundException('Accès réservé au super administrateur');
    }

    const existing = await this.prisma.laboratories.findFirst({
      where: { code: dto.code },
    });
    if (existing) throw new Error('Un laboratoire avec ce code existe déjà');

    const lab = await this.prisma.laboratories.create({
      data: {
        code: dto.code,
        name: dto.name,
        slug: dto.slug,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        is_active: dto.is_active !== false,
      },
    });
    return lab;
  }

  async update(id: string, dto: any, user: any) {
    const superAdmin = this.isSuperAdmin(user);
    const where: any = { id, deleted_at: null };
    if (!superAdmin && user?.laboratory_id) {
      where.id = user.laboratory_id;
    }

    const existing = await this.prisma.laboratories.findFirst({ where });
    if (!existing) throw new NotFoundException('Laboratoire introuvable');

    return this.prisma.laboratories.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        slug: dto.slug,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        is_active: dto.is_active,
      },
    });
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
  }
}
