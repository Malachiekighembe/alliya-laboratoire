import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CacheService } from '../cache/cache.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { generatePdf, PdfBlock } from './pdf.util.js';
import { CreateReportDto, DeliverReportDto, SearchReportsDto } from './reports.dtos.js';

/** Statuts §11.1 : rapport. */
export const REPORT_STATUSES = ['genere', 'disponible', 'remis', 'annule'] as const;

export function normalizeReportStatus(status?: string | null): string {
  if (!status) return 'genere';
  const key = String(status).toLowerCase();
  const aliases: Record<string, string> = {
    generated: 'genere',
    available: 'disponible',
    delivered: 'remis',
    cancelled: 'annule',
    canceled: 'annule',
  };
  return aliases[key] ?? key;
}

const USER_SELECT = { id: true, first_name: true, last_name: true, email: true };

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
    private readonly cache: CacheService,
  ) {}

  /** Tableau de bord agrégé du laboratoire (cache 30 s). */
  async getDashboard(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const cacheKey = `dashboard:${laboratory_id}:${dateFrom || ''}:${dateTo || ''}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: any = { laboratory_id };
    if (dateFrom) where.created_at = { gte: new Date(dateFrom) };
    if (dateTo) where.created_at = { ...(where.created_at ?? {}), lte: new Date(dateTo) };

    const [patients, visits, orders, specimens, results, pending, validated, invoices, payments, products, expiringLots] =
      await Promise.all([
        this.prisma.patients.count({ where }),
        this.prisma.visits.count({ where: { laboratory_id } }),
        this.prisma.orders.count({ where: { laboratory_id } }),
        this.prisma.specimens.count({ where: { laboratory_id } }),
        this.prisma.results.count({ where: { laboratory_id } }),
        this.prisma.results.count({ where: { laboratory_id, status: 'en_verification' } }),
        this.prisma.results.count({ where: { laboratory_id, status: 'valide' } }),
        this.prisma.invoices.aggregate({ where: { laboratory_id }, _sum: { total: true } }),
        this.prisma.payments.aggregate({ where: { laboratory_id, status: 'completed' }, _sum: { amount: true } }),
        this.prisma.products.findMany({ where: { laboratory_id, is_active: true } }),
        this.prisma.stock_lots.findMany({
          where: { laboratory_id, expiry_date: { lte: new Date(Date.now() + 7 * 86400000).toISOString() } },
        }),
      ]);

    const lowStock = (products ?? []).filter((p: any) => (p.current_stock ?? 0) <= (p.min_stock ?? 0)).length;
    const expiring = Array.isArray(expiringLots) ? expiringLots.length : Number(expiringLots ?? 0);

    const data = {
      patients: Number(patients ?? 0),
      visits: Number(visits ?? 0),
      orders: Number(orders ?? 0),
      specimens: Number(specimens ?? 0),
      results: Number(results ?? 0),
      pending_validations: Number(pending ?? 0),
      validated_results: Number(validated ?? 0),
      invoices_total: Number(invoices?._sum?.total || 0),
      payments_collected: Number(payments?._sum?.amount || 0),
      low_stock_alerts: lowStock,
      expiring_lots: expiring,
    };
    await this.cache.set(cacheKey, data, 30);
    return data;
  }

  async getAuditLogs(laboratory_id: string, page = 1, limit = 20) {
    return this.prisma.audit_logs.findMany({
      where: { laboratory_id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  /** Rapports validés d'un patient (§10.2). */
  async findByPatient(patientId: string, laboratory_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.reports.findMany({
        where: { patient_id: patientId, laboratory_id },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { generated_by: { select: USER_SELECT }, validated_by: { select: USER_SELECT } },
      }),
      this.prisma.reports.count({ where: { patient_id: patientId, laboratory_id } }),
    ]);
    return { items, total };
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: SearchReportsDto) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };
    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) where.status = normalizeReportStatus(filters.status);
    if (filters?.date_from || filters?.date_to) {
      where.report_date = {};
      if (filters.date_from) where.report_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.report_date.lte = new Date(filters.date_to);
    }

    const [items, total] = await Promise.all([
      this.prisma.reports.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.reports.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const report = await this.prisma.reports.findFirst({ where: { id, laboratory_id } });
    if (!report) throw new NotFoundException('Rapport non trouve');
    const deliveries = await this.prisma.report_deliveries.findMany({
      where: { report_id: id, laboratory_id },
      orderBy: { delivered_at: 'desc' },
    });
    return { ...(report as any), deliveries };
  }

  /** Contenu du PDF encodé en base64 (archivé en base, §10.1). */
  async getPdf(id: string, laboratory_id: string): Promise<Buffer> {
    const report = await this.prisma.reports.findFirst({ where: { id, laboratory_id } });
    if (!report) throw new NotFoundException('Rapport non trouve');
    const encoded = (report as any).pdf_url;
    if (encoded && String(encoded).startsWith('data:application/pdf;base64,')) {
      return Buffer.from(String(encoded).split(',')[1], 'base64');
    }
    throw new NotFoundException('Le PDF de ce rapport est introuvable');
  }

  /** Génère le rapport PDF des résultats validés (§10.1). */
  async generate(dto: CreateReportDto, laboratory_id: string, user: any) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');

    const laboratory = await this.prisma.laboratories.findFirst({ where: { id: laboratory_id } });

    const results = await this.prisma.results.findMany({
      where: { laboratory_id, patient_id: dto.patient_id, status: 'valide' },
      include: { test_catalog: true, performed_by: { select: USER_SELECT }, validated_by: { select: USER_SELECT } },
    });

    if (!results.length) {
      throw new BadRequestException("Aucun resultat valide pour ce patient : le rapport ne peut pas etre genere");
    }

    const matricule = await this.metricUtil.generateReportMatricule(laboratory_id);

    const blocks: PdfBlock[] = [];
    const lab = laboratory as any;
    blocks.push({ text: [lab?.name, lab?.address, lab?.phone, lab?.email].filter(Boolean).join(' | '), size: 9 });
    blocks.push({ text: '', gapBefore: 6 });
    blocks.push({ text: `Rapport ${matricule}`, size: 12, bold: true });
    blocks.push({
      text: `Patient : ${(patient as any).last_name ?? ''} ${(patient as any).first_name ?? ''} — ${(patient as any).matricule ?? ''}`,
    });
    blocks.push({
      text: `Sexe : ${(patient as any).gender ?? '-'} | Naissance : ${(patient as any).birth_date ?? '-'}`,
    });
    blocks.push({ text: `Date d'emission : ${new Date().toLocaleString('fr-FR')}` });
    blocks.push({ text: '', gapBefore: 8 });

    for (const result of results as any[]) {
      const test = result.test_catalog ?? {};
      blocks.push({ text: `${test.code ?? ''} — ${test.name ?? ''}`, size: 11, bold: true, gapBefore: 6 });
      blocks.push({
        text: `Matricule : ${result.matricule ?? '-'} | Statut : ${normalizeReportStatus(result.status)}`,
        size: 9,
      });
      if (result.result_type === 'qualitative' || !result.value) {
        blocks.push({ text: `Resultat : ${result.qualitative_value ?? '-'}` });
      } else {
        blocks.push({
          text: `Resultat : ${result.value} ${result.unit ?? ''} (reference : ${result.reference_range ?? '-'})`,
        });
      }
      if (result.observations) blocks.push({ text: `Observations : ${result.observations}`, size: 9 });

      const parameters = await this.prisma.result_parameters.findMany({
        where: { result_id: result.id, laboratory_id },
        orderBy: { position: 'asc' },
      });
      for (const parameter of parameters as any[]) {
        blocks.push({
          text: `   - ${parameter.name} : ${parameter.value ?? '-'} ${parameter.unit ?? ''} [${parameter.reference_range ?? '-'}]`,
          size: 9,
        });
      }

      const validator = result.validated_by as any;
      blocks.push({
        text: `Valide par : ${validator ? `${validator.first_name ?? ''} ${validator.last_name ?? ''}`.trim() : '-'} le ${
          result.validated_at ? new Date(result.validated_at).toLocaleString('fr-FR') : '-'
        }`,
        size: 9,
      });
    }

    blocks.push({ text: '', gapBefore: 10 });
    blocks.push({
      text: `Document confidentiel — ${matricule} — emis le ${new Date().toLocaleDateString('fr-FR')}`,
      size: 8,
    });

    const pdf = generatePdf(`Rapport ${matricule}`, blocks);

    const report = await this.prisma.reports.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: dto.patient_id,
        visit_id: dto.visit_id ?? null,
        order_id: dto.order_id ?? null,
        status: 'disponible',
        pdf_url: `data:application/pdf;base64,${pdf.toString('base64')}`,
        pdf_path: `reports/${matricule}.pdf`,
        generated_by_id: user?.id ?? null,
        notes: dto.notes ?? null,
      },
    });

    return { ...(report as any), size: pdf.length };
  }

  /** Enregistrement de la remise au patient (§10.3). */
  async deliver(id: string, laboratory_id: string, dto: DeliverReportDto, user_id: string) {
    const report = await this.prisma.reports.findFirst({ where: { id, laboratory_id } });
    if (!report) throw new NotFoundException('Rapport non trouve');

    const delivery = await this.prisma.report_deliveries.create({
      data: {
        laboratory_id,
        report_id: id,
        patient_id: (report as any).patient_id,
        delivered_at: dto.delivered_at ? new Date(dto.delivered_at).toISOString() : new Date().toISOString(),
        delivered_by_id: user_id,
        recipient_name: dto.recipient_name ?? null,
        recipient_relation: dto.recipient_relation ?? null,
        delivery_mode: dto.delivery_mode ?? 'remise_en_main_propre',
        notes: dto.notes ?? null,
      },
    });

    await this.prisma.reports.update({ where: { id }, data: { status: 'remis' } });
    return delivery;
  }

  async findDeliveries(id: string, laboratory_id: string) {
    return this.prisma.report_deliveries.findMany({
      where: { report_id: id, laboratory_id },
      orderBy: { delivered_at: 'desc' },
    });
  }
}