import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { PatientsService } from '../patients/patients.service.js';
import { CreateVisitDto, CreateOrderDto, UpdateVisitDto, SearchVisitsDto } from './visits.dtos.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
    private readonly patientsService: PatientsService,
  ) {}

  async create(createVisitDto: CreateVisitDto, laboratory_id: string, created_by_id: string) {
    await this.patientsService.findById(createVisitDto.patient_id, laboratory_id);
    const matricule = await this.metricUtil.generateVisitMatricule(laboratory_id);
    const visit = await this.prisma.visits.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: createVisitDto.patient_id,
        created_by_id,
        practitioner_id: createVisitDto.practitioner_id || null,
        visit_date: createVisitDto.visit_date ? new Date(createVisitDto.visit_date) : new Date(),
        status: 'scheduled',
        reason: createVisitDto.reason || null,
        notes: createVisitDto.notes || null,
      },
      include: { patient: true },
    });
    return visit;
  }

  async createOrder(orderDto: CreateOrderDto, laboratory_id: string, created_by_id: string) {
    await this.patientsService.findById(orderDto.patient_id, laboratory_id);
    const tests = await this.prisma.test_catalog.findMany({
      where: { id: { in: orderDto.items.map((i) => i.test_catalog_id) }, laboratory_id },
    });
    if (tests.length !== orderDto.items.length) throw new BadRequestException('Tests invalides');
    const matricule = await this.metricUtil.generateMatricule(laboratory_id, 'DEM', 'LAB');
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.orders.create({
        data: {
          laboratory_id,
          matricule,
          visit_id: orderDto.visit_id || null,
          patient_id: orderDto.patient_id,
          practitioner_id: orderDto.practitioner_id || null,
          created_by_id,
          status: 'draft',
          priority: orderDto.priority || 'normal',
          notes: orderDto.notes || null,
          order_items: {
            create: orderDto.items.map((item) => {
              const t = tests.find((x: any) => x.id === item.test_catalog_id)!;
              return {
                laboratory_id,
                test_catalog_id: item.test_catalog_id,
                item_code: item.item_code || t.code,
                item_name: item.item_name || t.name,
                status: 'pending',
                notes: item.notes || null,
              };
            }),
          },
        },
        include: { order_items: true },
      });
      return order;
    });
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, filters?: SearchVisitsDto) {
    const where: any = { laboratory_id };
    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.date_from || filters?.date_to) {
      where.visit_date = {};
      if (filters.date_from) where.visit_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.visit_date.lte = new Date(filters.date_to);
    }
    if (filters?.search) {
      where.OR = [
        { matricule: { contains: filters.search, mode: 'insensitive' } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.visits.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { visit_date: 'desc' }, include: { patient: true } }),
      this.prisma.visits.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const visit = await this.prisma.visits.findFirst({
      where: { id, laboratory_id },
      include: { patient: true, practitioner: true, creator: true, orders: { include: { order_items: true } } },
    });
    if (!visit) throw new NotFoundException('Visite non trouv�e');
    return visit;
  }

  async findByPatient(patientId: string, laboratory_id: string, pagination: PaginationDto) {
    return this.findAll(laboratory_id, pagination, { patient_id: patientId } as any);
  }

  async update(id: string, laboratory_id: string, dto: UpdateVisitDto) {
    await this.findById(id, laboratory_id);
    const data: any = {};
    if (dto.practitioner_id !== undefined) data.practitioner_id = dto.practitioner_id || null;
    if (dto.visit_date !== undefined) data.visit_date = new Date(dto.visit_date);
    if (dto.reason !== undefined) data.reason = dto.reason || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.visits.update({ where: { id }, data });
  }

  async cancel(id: string, laboratory_id: string, reason?: string) {
    await this.findById(id, laboratory_id);
    return this.prisma.visits.update({ where: { id }, data: { status: 'cancelled', reason: reason || null } });
  }

  async complete(id: string, laboratory_id: string) {
    await this.findById(id, laboratory_id);
    return this.prisma.visits.update({ where: { id }, data: { status: 'completed' } });
  }

  async remove(id: string, laboratory_id: string) {
    await this.findById(id, laboratory_id);
    await this.prisma.visits.delete({ where: { id } });
    return { success: true };
  }

  async getStatistics(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = { laboratory_id };
    if (dateFrom || dateTo) {
      where.visit_date = {};
      if (dateFrom) where.visit_date.gte = new Date(dateFrom);
      if (dateTo) where.visit_date.lte = new Date(dateTo);
    }
    const total = await this.prisma.visits.count({ where });
    return { total };
  }

  async getOrdersByVisit(visitId: string, laboratory_id: string) {
    await this.findById(visitId, laboratory_id);
    return this.prisma.orders.findMany({ where: { visit_id: visitId, laboratory_id }, include: { order_items: true } });
  }
}
