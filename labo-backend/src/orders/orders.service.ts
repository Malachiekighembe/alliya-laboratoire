import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { CreateOrderDto, CreateOrderItemDto, UpdateOrderDto, UpdateOrderItemDto } from './orders.dtos.js';

/** Statuts §11.1 : demande d'analyses. */
export const ORDER_STATUSES = ['en_attente', 'acceptee', 'en_cours', 'terminee', 'annulee'] as const;

const STATUS_ALIASES: Record<string, string> = {
  draft: 'en_attente',
  pending: 'en_attente',
  demandee: 'en_attente',
  submitted: 'acceptee',
  accepted: 'acceptee',
  validated: 'acceptee',
  in_progress: 'en_cours',
  completed: 'terminee',
  cancelled: 'annulee',
  canceled: 'annulee',
};

export function normalizeOrderStatus(status?: string | null): string {
  if (!status) return 'en_attente';
  const key = String(status).toLowerCase();
  return STATUS_ALIASES[key] ?? key;
}

const RELATIONS = {
  patient: true,
  visit: true,
  practitioner: true,
  order_items: true,
  created_by: true,
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  /** Résout le prix unitaire depuis le catalogue et calcule le total. */
  private async buildItems(laboratory_id: string, items: CreateOrderItemDto[]) {
    const resolved: any[] = [];
    let total = 0;
    for (const item of items) {
      const test = await this.prisma.test_catalog.findFirst({
        where: { id: item.test_catalog_id, laboratory_id },
      });
      if (!test) {
        throw new NotFoundException(`Analyse introuvable : ${item.test_catalog_id}`);
      }
      const quantity = item.quantity ?? 1;
      const unitPrice = Number(item.unit_price ?? (test as any).price ?? 0);
      const totalPrice = quantity * unitPrice;
      total += totalPrice;
      resolved.push({
        laboratory_id,
        test_catalog_id: item.test_catalog_id,
        item_code: (test as any).code ?? null,
        item_name: (test as any).name,
        status: 'en_attente',
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        reference_range: (test as any).reference_range ?? null,
        result_unit: (test as any).unit ?? null,
        notes: item.notes ?? null,
      });
    }
    return { items: resolved, total: Number(total.toFixed(2)) };
  }

  async create(dto: CreateOrderDto, laboratory_id: string, created_by_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');

    if (dto.visit_id) {
      const visit = await this.prisma.visits.findFirst({ where: { id: dto.visit_id, laboratory_id } });
      if (!visit) throw new NotFoundException('Visite non trouvee');
    }

    if (dto.practitioner_id) {
      const practitioner = await this.prisma.practitioners.findFirst({
        where: { id: dto.practitioner_id, laboratory_id },
      });
      if (!practitioner) throw new NotFoundException('Praticien non trouve');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Une demande doit contenir au moins une analyse');
    }

    const { items, total } = await this.buildItems(laboratory_id, dto.items);
    const matricule = await this.metricUtil.generateOrderMatricule(laboratory_id);

    return this.prisma.orders.create({
      data: {
        laboratory_id,
        matricule,
        visit_id: dto.visit_id || null,
        patient_id: dto.patient_id,
        practitioner_id: dto.practitioner_id || null,
        created_by_id,
        status: normalizeOrderStatus('en_attente'),
        priority: dto.priority || 'normale',
        notes: dto.notes || null,
        total_price: total,
        payment_status: 'non_paye',
        order_items: { create: items },
      },
      include: RELATIONS,
    });
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = normalizeOrderStatus(filters.status);
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.payment_status) where.payment_status = filters.payment_status;
    if (filters?.date_from || filters?.date_to) {
      where.order_date = {};
      if (filters.date_from) where.order_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.order_date.lte = new Date(filters.date_to);
    }
    if (filters?.search) {
      where.OR = [
        { matricule: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order_date: 'desc' },
        include: RELATIONS,
      }),
      this.prisma.orders.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id, laboratory_id },
      include: RELATIONS,
    });
    if (!order) throw new NotFoundException('Demande non trouvee');
    return order;
  }

  async findByPatient(patientId: string, laboratory_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { laboratory_id, patient_id: patientId };
    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order_date: 'desc' },
        include: RELATIONS,
      }),
      this.prisma.orders.count({ where }),
    ]);
    return { items, total };
  }

  async update(id: string, laboratory_id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.orders.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Demande non trouvee');

    const data: any = {};
    if (dto.status !== undefined) data.status = normalizeOrderStatus(dto.status);
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.payment_status !== undefined) data.payment_status = dto.payment_status;

    return this.prisma.orders.update({ where: { id }, data, include: RELATIONS });
  }

  async addItem(id: string, laboratory_id: string, dto: CreateOrderItemDto) {
    const order = await this.prisma.orders.findFirst({ where: { id, laboratory_id } });
    if (!order) throw new NotFoundException('Demande non trouvee');
    if (normalizeOrderStatus((order as any).status) !== 'en_attente') {
      throw new BadRequestException('Seule une demande en attente peut etre modifiee');
    }

    const { items: builtItems } = await this.buildItems(laboratory_id, [dto]);
    const item = builtItems[0];
    await this.prisma.order_items.create({ data: { ...item, order_id: id } });

    const items = await this.prisma.order_items.findMany({ where: { order_id: id, laboratory_id } });
    const total = items.reduce((sum: number, i: any) => sum + Number(i.total_price ?? 0), 0);
    await this.prisma.orders.update({ where: { id }, data: { total_price: Number(total.toFixed(2)) } });

    return this.findById(id, laboratory_id);
  }

  async removeItem(id: string, itemId: string, laboratory_id: string) {
    const item = await this.prisma.order_items.findFirst({ where: { id: itemId, order_id: id, laboratory_id } });
    if (!item) throw new NotFoundException('Ligne de demande non trouvee');
    await this.prisma.order_items.delete({ where: { id: itemId } });

    const items = await this.prisma.order_items.findMany({ where: { order_id: id, laboratory_id } });
    const total = items.reduce((sum: number, i: any) => sum + Number(i.total_price ?? 0), 0);
    await this.prisma.orders.update({ where: { id }, data: { total_price: Number(total.toFixed(2)) } });
    return { success: true };
  }

  async updateItem(id: string, itemId: string, laboratory_id: string, dto: UpdateOrderItemDto) {
    const item = await this.prisma.order_items.findFirst({ where: { id: itemId, order_id: id, laboratory_id } });
    if (!item) throw new NotFoundException('Ligne de demande non trouvee');
    return this.prisma.order_items.update({
      where: { id: itemId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.result_value !== undefined ? { result_value: dto.result_value } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  /**
   * Envoi au laboratoire (§5.3) : la demande passe "acceptee" et chaque analyse
   * devient une file d'attente (analysis_runs) pour le technicien.
   */
  async sendToLab(id: string, laboratory_id: string, userId: string) {
    const order = await this.findById(id, laboratory_id);
    const status = normalizeOrderStatus((order as any).status);
    if (status !== 'en_attente') {
      throw new BadRequestException('Seule une demande en attente peut etre envoyee au laboratoire');
    }

    const items = ((order as any).order_items ?? []) as any[];
    if (!items.length) {
      throw new BadRequestException('La demande ne contient aucune analyse');
    }

    for (const item of items) {
      const existing = await this.prisma.analysis_runs.findFirst({
        where: { order_item_id: item.id, laboratory_id },
      });
      if (existing) continue;
      const matricule = await this.metricUtil.generateAnalysisMatricule(laboratory_id);
      await this.prisma.analysis_runs.create({
        data: {
          laboratory_id,
          matricule,
          patient_id: (order as any).patient_id,
          visit_id: (order as any).visit_id ?? null,
          order_id: id,
          order_item_id: item.id,
          test_catalog_id: item.test_catalog_id,
          performed_by_id: userId,
          section: null,
          status: 'en_attente',
          priority: (order as any).priority ?? 'normale',
          notes: item.notes ?? null,
        },
      });
      await this.prisma.order_items.update({ where: { id: item.id }, data: { status: 'en_attente' } });
    }

    return this.prisma.orders.update({
      where: { id },
      data: { status: 'acceptee', sent_to_lab_at: new Date().toISOString() },
      include: RELATIONS,
    });
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.orders.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Demande non trouvee');

    const items = await this.prisma.order_items.findMany({ where: { order_id: id, laboratory_id } });
    if (items.length) {
      for (const item of items) await this.prisma.order_items.delete({ where: { id: (item as any).id } });
    }
    await this.prisma.orders.delete({ where: { id } });
    return { success: true };
  }

  async getStatistics(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = { laboratory_id };
    if (dateFrom || dateTo) {
      where.order_date = {};
      if (dateFrom) where.order_date.gte = new Date(dateFrom);
      if (dateTo) where.order_date.lte = new Date(dateTo);
    }
    const orders = await this.prisma.orders.findMany({ where });
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let revenue = 0;
    for (const order of orders as any[]) {
      const status = normalizeOrderStatus(order.status);
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      const priority = order.priority ?? 'normale';
      byPriority[priority] = (byPriority[priority] ?? 0) + 1;
      revenue += Number(order.total_price ?? 0);
    }
    return {
      total: orders.length,
      revenue: Number(revenue.toFixed(2)),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
    };
  }
}