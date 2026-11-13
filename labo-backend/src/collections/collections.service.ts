import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreateCollectionDto,
  CreateSpecimensDto,
  SearchCollectionsDto,
  UpdateCollectionDto,
} from './collections.dtos.js';

/** Statuts §11.1 : prélèvement. */
export const COLLECTION_STATUSES = ['en_attente', 'en_cours', 'effectue', 'annule'] as const;

const COLLECTION_ALIASES: Record<string, string> = {
  pending: 'en_attente',
  scheduled: 'en_attente',
  in_progress: 'en_cours',
  collected: 'effectue',
  completed: 'effectue',
  cancelled: 'annule',
  canceled: 'annule',
};

export function normalizeCollectionStatus(status?: string | null): string {
  if (!status) return 'en_attente';
  const key = String(status).toLowerCase();
  return COLLECTION_ALIASES[key] ?? key;
}

const RELATIONS = { patient: true, visit: true, order: true, collected_by: true };

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async create(dto: CreateCollectionDto, laboratory_id: string, user_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: { id: dto.patient_id, laboratory_id, deleted_at: null },
    });
    if (!patient) throw new NotFoundException('Patient non trouve');

    if (dto.order_id) {
      const order = await this.prisma.orders.findFirst({ where: { id: dto.order_id, laboratory_id } });
      if (!order) throw new NotFoundException('Demande non trouvee');
    }

    const matricule = await this.metricUtil.generateCollectionMatricule(laboratory_id);

    return this.prisma.collections.create({
      data: {
        laboratory_id,
        matricule,
        patient_id: dto.patient_id,
        visit_id: dto.visit_id ?? null,
        order_id: dto.order_id ?? null,
        collection_date: dto.collection_date ? new Date(dto.collection_date).toISOString() : new Date().toISOString(),
        sample_type: dto.sample_type ?? null,
        site: dto.site ?? null,
        collected_by_id: user_id,
        status: dto.started ? 'en_cours' : 'en_attente',
        observations: dto.observations ?? null,
        difficulties: dto.difficulties ?? null,
        notes: dto.notes ?? null,
      },
      include: RELATIONS,
    });
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: SearchCollectionsDto) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.order_id) where.order_id = filters.order_id;
    if (filters?.status) where.status = normalizeCollectionStatus(filters.status);
    if (filters?.date_from || filters?.date_to) {
      where.collection_date = {};
      if (filters.date_from) where.collection_date.gte = new Date(filters.date_from);
      if (filters.date_to) where.collection_date.lte = new Date(filters.date_to);
    }
    if (filters?.search) {
      where.OR = [{ matricule: { contains: filters.search } }];
    }

    const [items, total] = await Promise.all([
      this.prisma.collections.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: RELATIONS,
      }),
      this.prisma.collections.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const collection = await this.prisma.collections.findFirst({
      where: { id, laboratory_id },
      include: RELATIONS,
    });
    if (!collection) throw new NotFoundException('Prelevement non trouve');

    const specimens = await this.prisma.specimens.findMany({
      where: { collection_id: id, laboratory_id },
    });

    return { ...(collection as any), specimens };
  }

  async findByPatient(patientId: string, laboratory_id: string, page = 1, limit = 20) {
    return this.findAll(laboratory_id, page, limit, { patient_id: patientId });
  }

  /** File d'attente du technicien : prélèvements non clôturés. */
  async findQueue(laboratory_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { laboratory_id, status: { in: ['en_attente', 'en_cours'] } };
    const [items, total] = await Promise.all([
      this.prisma.collections.findMany({
        where,
        skip,
        take: limit,
        orderBy: { collection_date: 'asc' },
        include: RELATIONS,
      }),
      this.prisma.collections.count({ where: { laboratory_id } }),
    ]);
    return { items, total };
  }

  async update(id: string, laboratory_id: string, dto: UpdateCollectionDto) {
    const existing = await this.prisma.collections.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Prelevement non trouve');

    const data: any = {};
    if (dto.status !== undefined) data.status = normalizeCollectionStatus(dto.status);
    if (dto.sample_type !== undefined) data.sample_type = dto.sample_type;
    if (dto.site !== undefined) data.site = dto.site;
    if (dto.observations !== undefined) data.observations = dto.observations;
    if (dto.difficulties !== undefined) data.difficulties = dto.difficulties;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.collections.update({ where: { id }, data, include: RELATIONS });
  }

  async start(id: string, laboratory_id: string) {
    return this.update(id, laboratory_id, { status: 'en_cours' });
  }

  async confirm(id: string, laboratory_id: string) {
    const existing = await this.findById(id, laboratory_id);
    if (normalizeCollectionStatus((existing as any).status) === 'annule') {
      throw new BadRequestException('Un prélèvement annulé ne peut pas être confirmé');
    }
    return this.prisma.collections.update({
      where: { id },
      data: { status: 'effectue' },
      include: RELATIONS,
    });
  }

  async cancel(id: string, laboratory_id: string, reason?: string) {
    if (!reason) throw new BadRequestException('Le motif est obligatoire pour annuler un prélèvement');
    const existing = await this.prisma.collections.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Prelevement non trouve');
    return this.prisma.collections.update({
      where: { id },
      data: {
        status: 'annule',
        observations: [((existing as any).observations ?? ''), `Annulation : ${reason}`].filter(Boolean).join(' | '),
      },
      include: RELATIONS,
    });
  }

  /**
   * Crée les échantillons issus du prélèvement (§7.3) : un prélèvement peut
   * produire plusieurs échantillons (types de tubes différents).
   */
  async createSpecimens(id: string, laboratory_id: string, dto: CreateSpecimensDto, user_id: string) {
    const collection = await this.prisma.collections.findFirst({ where: { id, laboratory_id } });
    if (!collection) throw new NotFoundException('Prelevement non trouve');
    if (!dto.specimens || dto.specimens.length === 0) {
      throw new BadRequestException('Au moins un echantillon est requis');
    }

    const created: any[] = [];
    for (const specimen of dto.specimens) {
      const matricule = await this.metricUtil.generateSpecimenMatricule(laboratory_id);
      const row = await this.prisma.specimens.create({
        data: {
          laboratory_id,
          matricule,
          collection_id: id,
          order_id: (collection as any).order_id ?? null,
          visit_id: (collection as any).visit_id ?? null,
          patient_id: (collection as any).patient_id,
          collected_by_id: user_id,
          collection_date: (collection as any).collection_date ?? new Date().toISOString(),
          type: specimen.type ?? (collection as any).sample_type ?? null,
          container: specimen.container ?? null,
          status: 'en_attente',
          notes: specimen.notes ?? null,
          qr_token: `${matricule}`,
        },
      });
      if (specimen.section) {
        await this.prisma.specimens.update({ where: { id: (row as any).id }, data: { section: specimen.section } });
      }
      created.push(row);
    }

    if (normalizeCollectionStatus((collection as any).status) === 'en_attente') {
      await this.prisma.collections.update({ where: { id }, data: { status: 'en_cours' } });
    }

    return created;
  }
}