import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreateAppointmentDto,
  SearchAppointmentsDto,
  UpdateAppointmentDto,
} from './appointments.dtos.js';

const RELATIONS = { patient: true, created_by: true };

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async create(dto: CreateAppointmentDto, laboratory_id: string, user_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');

    const matricule = await this.metricUtil.generateAppointmentMatricule(laboratory_id);
    return this.prisma.appointments.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: dto.patient_id,
        appointment_date: new Date(dto.appointment_date).toISOString(),
        status: dto.status ?? 'planifie',
        reason: dto.reason ?? null,
        notes: dto.notes ?? null,
        created_by_id: user_id,
      },
      include: RELATIONS,
    });
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: SearchAppointmentsDto) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };
    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.date_from || filters?.date_to) {
      where.appointment_date = {};
      if (filters.date_from) where.appointment_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.appointment_date.lte = new Date(filters.date_to);
    }

    const [items, total] = await Promise.all([
      this.prisma.appointments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appointment_date: 'asc' },
        include: RELATIONS,
      }),
      this.prisma.appointments.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const appointment = await this.prisma.appointments.findFirst({ where: { id, laboratory_id }, include: RELATIONS });
    if (!appointment) throw new NotFoundException('Rendez-vous non trouve');
    return appointment;
  }

  async findByPatient(patientId: string, laboratory_id: string) {
    const items = await this.prisma.appointments.findMany({
      where: { patient_id: patientId, laboratory_id },
      orderBy: { appointment_date: 'desc' },
      include: RELATIONS,
    });
    return { items, total: items.length };
  }

  async update(id: string, laboratory_id: string, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointments.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Rendez-vous non trouve');

    const data: any = {};
    if (dto.appointment_date !== undefined) data.appointment_date = new Date(dto.appointment_date).toISOString();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.reason !== undefined) data.reason = dto.reason;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.appointments.update({ where: { id }, data, include: RELATIONS });
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.appointments.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Rendez-vous non trouve');
    await this.prisma.appointments.delete({ where: { id } });
    return { success: true };
  }
}