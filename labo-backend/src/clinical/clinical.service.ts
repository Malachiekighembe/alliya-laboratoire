import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreateConsultationDto,
  CreatePrescriptionDto,
  SearchConsultationsDto,
  UpdateConsultationDto,
  UpdatePrescriptionDto,
} from './clinical.dtos.js';

@Injectable()
export class ClinicalService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  // --- Consultations (§2.5) ------------------------------------------------
  async createConsultation(dto: CreateConsultationDto, laboratory_id: string, user_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');

    const matricule = await this.metricUtil.generateConsultationMatricule(laboratory_id);
    return this.prisma.consultations.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: dto.patient_id,
        visit_id: dto.visit_id ?? null,
        practitioner_id: dto.practitioner_id ?? user_id,
        consultation_date: new Date().toISOString(),
        reason: dto.reason ?? null,
        diagnosis: dto.diagnosis ?? null,
        notes: dto.notes ?? null,
        status: 'en_cours',
      },
      include: { patient: true, practitioner: true },
    });
  }

  async findConsultations(laboratory_id: string, page = 1, limit = 20, filters?: SearchConsultationsDto) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };
    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.date_from || filters?.date_to) {
      where.consultation_date = {};
      if (filters.date_from) where.consultation_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.consultation_date.lte = new Date(filters.date_to);
    }

    const [items, total] = await Promise.all([
      this.prisma.consultations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consultation_date: 'desc' },
        include: { patient: true, practitioner: true },
      }),
      this.prisma.consultations.count({ where }),
    ]);
    return { items, total };
  }

  async findConsultation(id: string, laboratory_id: string) {
    const consultation = await this.prisma.consultations.findFirst({
      where: { id, laboratory_id },
      include: { patient: true, practitioner: true, visit: true },
    });
    if (!consultation) throw new NotFoundException('Consultation non trouvee');
    return consultation;
  }

  async updateConsultation(id: string, laboratory_id: string, dto: UpdateConsultationDto) {
    const existing = await this.prisma.consultations.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Consultation non trouvee');
    return this.prisma.consultations.update({
      where: { id },
      data: {
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.diagnosis !== undefined ? { diagnosis: dto.diagnosis } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  // --- Prescriptions (§2.5) ----------------------------------------------
  async createPrescription(dto: CreatePrescriptionDto, laboratory_id: string, user_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Une ordonnance doit contenir au moins une ligne');
    }

    const matricule = await this.metricUtil.generatePrescriptionMatricule(laboratory_id);
    const created = await this.prisma.prescriptions.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: dto.patient_id,
        visit_id: dto.visit_id ?? null,
        consultation_id: dto.consultation_id ?? null,
        practitioner_id: dto.practitioner_id ?? user_id,
        prescribed_at: new Date().toISOString(),
        notes: dto.notes ?? null,
        status: 'active',
        prescription_items: {
          create: dto.items.map((item, index) => ({
            laboratory_id,
            test_catalog_id: item.test_catalog_id ?? null,
            label: item.label,
            dosage: item.dosage ?? null,
            instructions: item.instructions ?? null,
            position: index,
          })),
        },
      },
      include: { patient: true, prescription_items: true },
    });

    return created;
  }

  async findPrescriptions(laboratory_id: string, patientId?: string) {
    const where: any = { laboratory_id };
    if (patientId) where.patient_id = patientId;
    return this.prisma.prescriptions.findMany({
      where,
      orderBy: { prescribed_at: 'desc' },
      include: { patient: true, practitioner: true, prescription_items: true },
    });
  }

  async findPrescription(id: string, laboratory_id: string) {
    const prescription = await this.prisma.prescriptions.findFirst({
      where: { id, laboratory_id },
      include: { patient: true, practitioner: true, prescription_items: true },
    });
    if (!prescription) throw new NotFoundException('Ordonnance non trouvee');
    return prescription;
  }

  async updatePrescription(id: string, laboratory_id: string, dto: UpdatePrescriptionDto) {
    const existing = await this.prisma.prescriptions.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Ordonnance non trouvee');
    return this.prisma.prescriptions.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  /**
   * Transformation d'une ordonnance en demande d'analyses (§5.3) :
   * seules les lignes rattachées à une analyse du catalogue sont reprises.
   */
  async convertToOrder(id: string, laboratory_id: string, user_id: string) {
    const prescription = await this.findPrescription(id, laboratory_id);
    const items = ((prescription as any).prescription_items ?? []).filter((item: any) => item.test_catalog_id);
    if (!items.length) {
      throw new BadRequestException("Aucune ligne d ordonnance ne correspond a une analyse du catalogue");
    }

    const matricule = await this.metricUtil.generateOrderMatricule(laboratory_id);
    let total = 0;
    const orderItems = items.map((item: any) => {
      const price = Number(item.unit_price ?? 0);
      total += price;
      return {
        laboratory_id,
        test_catalog_id: item.test_catalog_id,
        item_code: item.item_code ?? null,
        item_name: item.label,
        quantity: 1,
        unit_price: price,
        total_price: price,
        status: 'en_attente',
        notes: item.instructions ?? null,
      };
    });

    return this.prisma.orders.create({
      data: {
        laboratory_id,
        matricule,
        visit_id: (prescription as any).visit_id ?? null,
        patient_id: (prescription as any).patient_id,
        practitioner_id: (prescription as any).practitioner_id ?? user_id,
        created_by_id: user_id,
        status: 'en_attente',
        priority: 'normale',
        notes: `Issue de l ordonnance ${(prescription as any).matricule}`,
        total_price: Number(total.toFixed(2)),
        payment_status: 'non_paye',
        order_items: { create: orderItems },
      },
      include: { order_items: true },
    });
  }
}