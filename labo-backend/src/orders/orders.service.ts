import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";
import { MetricUtil } from "../common/utils/metric.util.js";
import { CreateOrderDto, UpdateOrderDto } from "./orders.dtos.js";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async create(createOrderDto: CreateOrderDto, laboratory_id: string, created_by_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: createOrderDto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) {
      throw new NotFoundException("Patient non trouve");
    }

    if (createOrderDto.visit_id) {
      const visit = await this.prisma.visits.findFirst({
        where: { id: createOrderDto.visit_id, laboratory_id },
      });
      if (!visit) {
        throw new NotFoundException("Visite non trouvee");
      }
    }

    if (createOrderDto.practitioner_id) {
      const practitioner = await this.prisma.practitioners.findFirst({
        where: { id: createOrderDto.practitioner_id, laboratory_id },
      });
      if (!practitioner) {
        throw new NotFoundException("Praticien non trouve");
      }
    }

    const matricule = await this.metricUtil.generateOrderMatricule(laboratory_id);

    const order = await this.prisma.orders.create({
      data: {
        laboratory_id,
        matricule,
        visit_id: createOrderDto.visit_id || null,
        patient_id: createOrderDto.patient_id,
        practitioner_id: createOrderDto.practitioner_id || null,
        created_by_id,
        status: "draft",
        priority: createOrderDto.priority || "normal",
        notes: createOrderDto.notes || null,
      },
      include: {
        patient: true,
        visit: true,
        practitioner: true,
        order_items: true,
        created_by: true,
      },
    });

    return order;
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.date_from || filters?.date_to) {
      where.order_date = {};
      if (filters.date_from) where.order_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.order_date.lte = new Date(filters.date_to);
    }
    if (filters?.search) {
      where.OR = [
        { matricule: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order_date: "desc" },
        include: {
          patient: true,
          visit: true,
          practitioner: true,
          order_items: true,
          created_by: true,
        },
      }),
      this.prisma.orders.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id, laboratory_id },
      include: {
        patient: true,
        visit: true,
        practitioner: true,
        order_items: true,
        created_by: true,
      },
    });
    if (!order) {
      throw new NotFoundException("Commande non trouvee");
    }
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
        orderBy: { order_date: "desc" },
        include: { patient: true, visit: true, practitioner: true, order_items: true },
      }),
      this.prisma.orders.count({ where }),
    ]);
    return { items, total };
  }

  async update(id: string, laboratory_id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.orders.findFirst({ where: { id, laboratory_id } });
    if (!existing) {
      throw new NotFoundException("Commande non trouvee");
    }
    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return this.prisma.orders.update({
      where: { id },
      data,
      include: {
        patient: true,
        visit: true,
        practitioner: true,
        order_items: true,
        created_by: true,
      },
    });
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.orders.findFirst({ where: { id, laboratory_id } });
    if (!existing) {
      throw new NotFoundException("Commande non trouvee");
    }
    const itemsCount = await this.prisma.order_items.count({ where: { order_id: id, laboratory_id } });
    if (itemsCount > 0) {
      throw new BadRequestException("Impossible de supprimer une commande avec des articles");
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
    const [byStatus, byPriority, total] = await Promise.all([
      this.prisma.orders.groupBy({ by: ["status"], where, _count: true }),
      this.prisma.orders.groupBy({ by: ["priority"], where, _count: true }),
      this.prisma.orders.count({ where }),
    ]);
    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      byPriority: byPriority.map((p: any) => ({ priority: p.priority, count: p._count })),
    };
  }
}
