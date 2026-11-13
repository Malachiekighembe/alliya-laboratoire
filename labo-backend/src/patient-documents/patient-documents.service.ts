import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreatePatientDocumentDto,
  SearchPatientDocumentsDto,
} from './patient-documents.dtos.js';

const DOCUMENT_TITLES: Record<string, string> = {
  bon_examen: "Bon d'examen",
  ordonnance: 'Ordonnance',
  compte_rendu: 'Compte rendu',
  facture: 'Facture',
};

@Injectable()
export class PatientDocumentsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async findAll(laboratory_id: string, filters: SearchPatientDocumentsDto & { page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { laboratory_id };
    if (filters.patient_id) where.patient_id = filters.patient_id;
    if (filters.order_id) where.order_id = filters.order_id;
    if (filters.document_type) where.document_type = filters.document_type;

    const [items, total] = await Promise.all([
      this.prisma.patient_documents.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.patient_documents.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const document = await this.prisma.patient_documents.findFirst({ where: { id, laboratory_id } });
    if (!document) throw new NotFoundException('Document introuvable');
    return document;
  }

  /**
   * Construit le contenu figé d'un bon d'examen à partir d'une demande :
   * identité, provenance, examens prescrits et montants. Le document reste
   * consultable même si la demande est modifiée ensuite.
   */
  private async buildOrderContent(laboratory_id: string, order: any) {
    const items = (order.order_items ?? []) as any[];
    const catalogIds = items.map((i) => i.test_catalog_id).filter(Boolean);
    const catalog = catalogIds.length
      ? await this.prisma.test_catalog.findMany({ where: { id: { in: catalogIds } } })
      : [];
    const byId = new Map<string, any>((catalog as any[]).map((c) => [c.id, c]));

    const lines = items.map((item) => {
      const test = byId.get(item.test_catalog_id) || {};
      const unitPrice = Number(item.unit_price ?? test.price ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return {
        test_catalog_id: item.test_catalog_id ?? null,
        code: item.code || test.code || '—',
        name: item.name || test.name || 'Analyse',
        category: test.category ?? null,
        sample_type: test.sample_type ?? null,
        container: test.container ?? null,
        preparation: test.preparation ?? null,
        unit: test.unit ?? null,
        quantity,
        unit_price: unitPrice,
        total_price: Number((unitPrice * quantity).toFixed(2)),
      };
    });

    const subtotal = Number(lines.reduce((sum, l) => sum + l.total_price, 0).toFixed(2));
    const discount = Number(order.discount_amount ?? 0);
    const tax = Number(order.tax_amount ?? 0);
    const total = Number(order.total_price ?? subtotal - discount + tax);

    return {
      patient: {
        id: order.patient_id,
        matricule: order.patient?.matricule ?? null,
        first_name: order.patient?.first_name ?? null,
        last_name: order.patient?.last_name ?? null,
        birth_date: order.patient?.birth_date ?? null,
        gender: order.patient?.gender ?? null,
        phone: order.patient?.phone ?? null,
        address: order.patient?.address ?? null,
        city: order.patient?.city ?? null,
      },
      visit: order.visit
        ? {
            matricule: order.visit.matricule ?? null,
            date: order.visit.visit_date ?? null,
            reason: order.visit.reason ?? null,
          }
        : null,
      order: {
        matricule: order.matricule ?? null,
        date: order.order_date ?? order.created_at ?? null,
        priority: order.priority ?? 'normale',
        payment_status: order.payment_status ?? null,
      },
      practitioner: order.practitioner
        ? `${order.practitioner.first_name ?? ''} ${order.practitioner.last_name ?? ''}`.trim() || null
        : null,
      reason: order.reason ?? order.visit?.reason ?? null,
      items: lines,
      totals: {
        subtotal,
        discount,
        tax,
        total: Number(total.toFixed(2)),
        currency: order.currency ?? 'USD',
      },
      notes: order.notes ?? null,
    };
  }

  /** Crée un bon d'examen (ou autre document) pour un patient. */
  async create(laboratory_id: string, dto: CreatePatientDocumentDto, userId: string) {
    const patient = await this.prisma.patients.findFirst({ where: { id: dto.patient_id, laboratory_id } });
    if (!patient) throw new NotFoundException('Patient introuvable');

    let content: any = dto.content ?? {};
    let title = dto.title?.trim() || DOCUMENT_TITLES[dto.document_type] || 'Document';
    let reference: string | null = null;
    let orderId: string | null = dto.order_id ?? null;
    let visitId: string | null = dto.visit_id ?? null;

    if (dto.order_id) {
      const order = await this.prisma.orders.findFirst({
        where: { id: dto.order_id, laboratory_id },
        include: { patient: true, visit: true, practitioner: true, order_items: true },
      });
      if (!order) throw new NotFoundException('Demande introuvable');
      if (order.patient_id !== dto.patient_id) {
        throw new BadRequestException('La demande ne concerne pas ce patient');
      }
      content = await this.buildOrderContent(laboratory_id, order);
      visitId = (order as any).visit_id ?? visitId;
      reference = await this.metricUtil.generateMatricule(laboratory_id, 'DOC');
      if (!dto.title) title = DOCUMENT_TITLES[dto.document_type] || title;
    }

    const document = await this.prisma.patient_documents.create({
      data: {
        laboratory_id,
        patient_id: dto.patient_id,
        visit_id: visitId,
        order_id: orderId,
        document_type: dto.document_type,
        title,
        reference,
        content: {
          ...content,
          notes: dto.notes ?? content?.notes ?? null,
          laboratory: await this.laboratoryHeader(laboratory_id),
        },
        created_by_id: userId,
      },
    });

    return document;
  }

  private async laboratoryHeader(laboratory_id: string) {
    const lab = await this.prisma.laboratories.findFirst({ where: { id: laboratory_id } });
    if (!lab) return null;
    return {
      name: lab.name ?? null,
      address: lab.address ?? null,
      phone: lab.phone ?? null,
      email: lab.email ?? null,
    };
  }

  async markPrinted(id: string, laboratory_id: string, userId: string) {
    await this.findById(id, laboratory_id);
    return this.prisma.patient_documents.update({
      where: { id },
      data: { printed_at: new Date().toISOString(), printed_by_id: userId },
    });
  }

  async remove(id: string, laboratory_id: string) {
    await this.findById(id, laboratory_id);
    await this.prisma.patient_documents.delete({ where: { id } });
    return { success: true };
  }
}