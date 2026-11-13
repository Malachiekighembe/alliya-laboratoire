import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreateAnalysisRunDto,
  SearchAnalysisRunsDto,
  UpdateAnalysisRunDto,
} from './analyses.dtos.js';

/** Statuts §11.1 : analyse. */
export const ANALYSIS_STATUSES = ['en_attente', 'en_cours', 'terminee', 'suspendue', 'a_reprendre', 'annulee'] as const;

const ANALYSIS_ALIASES: Record<string, string> = {
  pending: 'en_attente',
  queued: 'en_attente',
  in_progress: 'en_cours',
  running: 'en_cours',
  completed: 'terminee',
  done: 'terminee',
  suspended: 'suspendue',
  paused: 'suspendue',
  rework: 'a_reprendre',
  cancelled: 'annulee',
};

export function normalizeAnalysisStatus(status?: string | null): string {
  if (!status) return 'en_attente';
  const key = String(status).toLowerCase();
  return ANALYSIS_ALIASES[key] ?? key;
}

const RELATIONS = { patient: true, visit: true, order: true, specimen: true, test_catalog: true, performed_by: true };

@Injectable()
export class AnalysesService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async create(dto: CreateAnalysisRunDto, laboratory_id: string, user_id: string) {
    const test = await this.prisma.test_catalog.findFirst({
      where: { id: dto.test_catalog_id, laboratory_id },
    });
    if (!test) throw new NotFoundException('Analyse introuvable');

    let patientId = dto.patient_id ?? null;
    let visitId: string | null = null;
    if (dto.order_id) {
      const order = await this.prisma.orders.findFirst({ where: { id: dto.order_id, laboratory_id } });
      if (!order) throw new NotFoundException('Demande non trouvee');
      patientId = patientId ?? (order as any).patient_id;
      visitId = (order as any).visit_id ?? null;
    }
    if (!patientId) throw new BadRequestException('Le patient est requis');

    const matricule = await this.metricUtil.generateAnalysisMatricule(laboratory_id);
    return this.prisma.analysis_runs.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: patientId,
        visit_id: visitId,
        order_id: dto.order_id ?? null,
        order_item_id: dto.order_item_id ?? null,
        specimen_id: dto.specimen_id ?? null,
        test_catalog_id: dto.test_catalog_id,
        performed_by_id: dto.performed_by_id ?? user_id,
        section: dto.section ?? (test as any).section ?? null,
        status: 'en_attente',
        priority: dto.priority ?? 'normale',
        notes: dto.notes ?? null,
      },
      include: RELATIONS,
    });
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: SearchAnalysisRunsDto) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.order_id) where.order_id = filters.order_id;
    if (filters?.specimen_id) where.specimen_id = filters.specimen_id;
    if (filters?.status) where.status = normalizeAnalysisStatus(filters.status);
    if (filters?.section) where.section = filters.section;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.date_from || filters?.date_to) {
      where.created_at = {};
      if (filters.date_from) where.created_at.gte = new Date(filters.date_from);
      if (filters.date_to) where.created_at.lte = new Date(filters.date_to);
    }

    const [items, total] = await Promise.all([
      this.prisma.analysis_runs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: RELATIONS,
      }),
      this.prisma.analysis_runs.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const run = await this.prisma.analysis_runs.findFirst({ where: { id, laboratory_id }, include: RELATIONS });
    if (!run) throw new NotFoundException('Analyse non trouvee');
    return run;
  }

  async findByPatient(patientId: string, laboratory_id: string, page = 1, limit = 20) {
    return this.findAll(laboratory_id, page, limit, { patient_id: patientId });
  }

  async update(id: string, laboratory_id: string, dto: UpdateAnalysisRunDto) {
    await this.findById(id, laboratory_id);
    const data: any = {};
    if (dto.status !== undefined) data.status = normalizeAnalysisStatus(dto.status);
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.section !== undefined) data.section = dto.section;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.performed_by_id !== undefined) data.performed_by_id = dto.performed_by_id;
    return this.prisma.analysis_runs.update({ where: { id }, data, include: RELATIONS });
  }

  /** Démarrage de l'analyse (§8.1). */
  async start(id: string, laboratory_id: string, user_id: string) {
    const run = await this.findById(id, laboratory_id);
    const status = normalizeAnalysisStatus((run as any).status);
    if (!['en_attente', 'a_reprendre', 'suspendue'].includes(status)) {
      throw new BadRequestException(`Demarrage impossible depuis le statut ${status}`);
    }
    return this.prisma.analysis_runs.update({
      where: { id },
      data: {
        status: 'en_cours',
        started_at: new Date().toISOString(),
        performed_by_id: user_id,
        suspended_at: null,
      },
      include: RELATIONS,
    });
  }

  async suspend(id: string, laboratory_id: string, reason?: string) {
    const run = await this.findById(id, laboratory_id);
    if (normalizeAnalysisStatus((run as any).status) !== 'en_cours') {
      throw new BadRequestException('Seule une analyse en cours peut etre suspendue');
    }
    const notes = reason
      ? [((run as any).notes ?? ''), `Suspendue : ${reason}`].filter(Boolean).join(' | ')
      : (run as any).notes ?? null;
    return this.prisma.analysis_runs.update({
      where: { id },
      data: { status: 'suspendue', suspended_at: new Date().toISOString(), notes },
      include: RELATIONS,
    });
  }

  async resume(id: string, laboratory_id: string, user_id: string) {
    return this.start(id, laboratory_id, user_id);
  }

  async complete(id: string, laboratory_id: string) {
    const run = await this.findById(id, laboratory_id);
    const status = normalizeAnalysisStatus((run as any).status);
    if (!['en_cours', 'suspendue', 'a_reprendre'].includes(status)) {
      throw new BadRequestException(`Completion impossible depuis le statut ${status}`);
    }
    return this.prisma.analysis_runs.update({
      where: { id },
      data: { status: 'terminee', completed_at: new Date().toISOString() },
      include: RELATIONS,
    });
  }

  /** Reprise demandée par le biologiste (§9.3). */
  async rework(id: string, laboratory_id: string, reason?: string) {
    const run = await this.findById(id, laboratory_id);
    const notes = reason
      ? [((run as any).notes ?? ''), `Reprise : ${reason}`].filter(Boolean).join(' | ')
      : (run as any).notes ?? null;
    return this.prisma.analysis_runs.update({
      where: { id },
      data: { status: 'a_reprendre', notes },
      include: RELATIONS,
    });
  }

  async cancel(id: string, laboratory_id: string) {
    return this.prisma.analysis_runs.update({
      where: { id },
      data: { status: 'annulee' },
      include: RELATIONS,
    });
  }
}