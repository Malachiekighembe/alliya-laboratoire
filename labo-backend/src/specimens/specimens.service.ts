import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { PatientsService } from '../patients/patients.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateSpecimenDto, UpdateSpecimenDto } from './specimens.dtos.js';

/** Statuts §11.1 : échantillon. */
export const SPECIMEN_STATUSES = ['en_attente', 'recu', 'accepte', 'rejete', 'epuise'] as const;

const SPECIMEN_ALIASES: Record<string, string> = {
  pending: 'en_attente',
  received: 'recu',
  processing: 'accepte',
  completed: 'epuise',
  accepted: 'accepte',
  rejected: 'rejete',
  discarded: 'epuise',
};

export function normalizeSpecimenStatus(status?: string | null): string {
  if (!status) return 'en_attente';
  const key = String(status).toLowerCase();
  return SPECIMEN_ALIASES[key] ?? key;
}

@Injectable()
export class SpecimensService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
    private readonly patientsService: PatientsService,
  ) {}

  async create(createSpecimenDto: CreateSpecimenDto, laboratory_id: string, collected_by_id: string) {
    // Vérifier que le patient existe
    const patient = await this.prisma.patients.findFirst({
      where: {
        id: createSpecimenDto.patient_id,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    // Vérifier la visite si fournie
    if (createSpecimenDto.visit_id) {
      const visit = await this.prisma.visits.findFirst({
        where: {
          id: createSpecimenDto.visit_id,
          laboratory_id,
        },
      });
      if (!visit) {
        throw new NotFoundException('Visite non trouvée');
      }
    }

    // Vérifier la commande si fournie
    if (createSpecimenDto.order_id) {
      const order = await this.prisma.orders.findFirst({
        where: {
          id: createSpecimenDto.order_id,
          laboratory_id,
        },
      });
      if (!order) {
        throw new NotFoundException('Commande non trouvée');
      }
    }

    const matricule = await this.metricUtil.generateSpecimenMatricule(laboratory_id);

    const specimen = await this.prisma.specimens.create({
      data: {
        laboratory_id,
        matricule,
        order_id: createSpecimenDto.order_id || null,
        visit_id: createSpecimenDto.visit_id || null,
        patient_id: createSpecimenDto.patient_id,
        collected_by_id,
        type: createSpecimenDto.type,
        container: createSpecimenDto.container || null,
        status: 'en_attente',
        qr_token: matricule,
        notes: createSpecimenDto.notes || null,
        collection_date: new Date(),
      },
      include: {
        patient: true,
        visit: true,
        order: true,
        collector: true,
      },
    });

    return specimen;
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, filters?: any) {
    const where: any = {
      laboratory_id,
    };

    if (filters?.patient_id) {
      where.patient_id = filters.patient_id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = { contains: filters.type, mode: 'insensitive' };
    }

    if (filters?.date_from || filters?.date_to) {
      where.collection_date = {};
      if (filters?.date_from) {
        where.collection_date.gte = new Date(filters.date_from);
      }
      if (filters?.date_to) {
        where.collection_date.lte = new Date(filters.date_to);
      }
    }

    if (filters?.search) {
      where.OR = [
        { matricule: { contains: filters.search, mode: 'insensitive' } },
        { type: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.specimens.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { collection_date: 'desc' },
        include: {
          patient: true,
          visit: true,
          order: true,
          collector: true,
        },
      }),
      this.prisma.specimens.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: {
        id,
        laboratory_id,
      },
      include: {
        patient: true,
        visit: true,
        order: true,
        collector: true,
        results: true,
      },
    });

    if (!specimen) {
      throw new NotFoundException('Échantillon non trouvé');
    }

    return specimen;
  }

  async findByPatient(patientId: string, laboratory_id: string, pagination: PaginationDto) {
    // Vérifier que le patient existe
    const patient = await this.prisma.patients.findFirst({
      where: {
        id: patientId,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const where = {
      laboratory_id,
      patient_id: patientId,
    };

    const [items, total] = await Promise.all([
      this.prisma.specimens.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { collection_date: 'desc' },
        include: {
          patient: true,
          visit: true,
          order: true,
          collector: true,
        },
      }),
      this.prisma.specimens.count({ where }),
    ]);

    return { items, total };
  }

  async findByMatricule(matricule: string, laboratory_id: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: {
        matricule,
        laboratory_id,
      },
      include: {
        patient: true,
        visit: true,
        order: true,
        collector: true,
        results: true,
      },
    });

    if (!specimen) {
      throw new NotFoundException('Échantillon non trouvé');
    }

    return specimen;
  }

  async update(id: string, laboratory_id: string, updateSpecimenDto: UpdateSpecimenDto) {
    const existing = await this.prisma.specimens.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Échantillon non trouvé');
    }

    const data: any = {};
    if (updateSpecimenDto.type !== undefined) data.type = updateSpecimenDto.type;
    if (updateSpecimenDto.container !== undefined) data.container = updateSpecimenDto.container;
    if (updateSpecimenDto.notes !== undefined) data.notes = updateSpecimenDto.notes;
    if (updateSpecimenDto.status !== undefined) data.status = updateSpecimenDto.status;

    const specimen = await this.prisma.specimens.update({
      where: { id },
      data,
      include: {
        patient: true,
        visit: true,
        order: true,
        collector: true,
      },
    });

    return specimen;
  }

  async updateStatus(id: string, laboratory_id: string, status: string, notes?: string) {
    const existing = await this.prisma.specimens.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Échantillon non trouvé');
    }

    // Statuts §11.1 : en_attente -> recu -> accepte -> epuise, avec rejet possible.
    const normalized = normalizeSpecimenStatus(existing.status);
    const target = normalizeSpecimenStatus(status);
    const validTransitions: Record<string, string[]> = {
      en_attente: ['recu', 'accepte', 'rejete'],
      recu: ['accepte', 'rejete'],
      accepte: ['epuise', 'rejete'],
      rejete: ['en_attente'],
      epuise: [],
    };

    if (!validTransitions[normalized]?.includes(target)) {
      throw new BadRequestException(`Transition de statut invalide: ${normalized} -> ${target}`);
    }

    const data: any = { status: target };
    if (target === 'recu') data.received_at = new Date().toISOString();
    if (target === 'accepte') {
      data.accepted_at = new Date().toISOString();
      data.accepted_by_id = (existing as any).collected_by_id ?? null;
    }
    if (target === 'rejete') {
      data.rejected_at = new Date().toISOString();
      data.rejected_reason = notes ?? (existing as any).rejected_reason ?? null;
    }
    if (notes !== undefined && target !== 'rejete') {
      data.notes = notes ? (existing.notes ? `${existing.notes}\n` : notes) : existing.notes;
    }

    const specimen = await this.prisma.specimens.update({
      where: { id },
      data,
      include: {
        patient: true,
        visit: true,
        order: true,
        collector: true,
      },
    });

    return specimen;
  }

  /** Acceptation de l'échantillon après contrôle (§7.4). */
  async accept(id: string, laboratory_id: string, section?: string) {
    const specimen = await this.updateStatus(id, laboratory_id, 'accepte');
    if (section) {
      return this.prisma.specimens.update({
        where: { id },
        data: { section },
        include: { patient: true, order: true },
      });
    }
    return specimen;
  }

  async assignSection(id: string, laboratory_id: string, section: string) {
    const existing = await this.prisma.specimens.findFirst({ where: { id, laboratory_id } });
    if (!existing) throw new NotFoundException('Échantillon non trouvé');
    return this.prisma.specimens.update({ where: { id }, data: { section } });
  }

  async reject(id: string, laboratory_id: string, reason?: string) {
    if (!reason) throw new BadRequestException('Le motif de rejet est obligatoire');
    return this.updateStatus(id, laboratory_id, 'rejete', reason);
  }

  async discard(id: string, laboratory_id: string, reason?: string) {
    return this.updateStatus(id, laboratory_id, "discarded", reason ? "Éliminé: " + reason : "Éliminé");
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.specimens.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Échantillon non trouvé');
    }

    // Ne pas supprimer s'il y a des résultats
    const resultsCount = await this.prisma.results.count({
      where: {
        specimen_id: id,
        laboratory_id,
      },
    });

    if (resultsCount > 0) {
      throw new ConflictException('Impossible de supprimer un échantillon avec des résultats associés');
    }

    await this.prisma.specimens.delete({
      where: { id },
    });

    return { success: true };
  }


  async findPublicByQrToken(token: string) {
    const specimen: any = await this.prisma.specimens.findFirst({
      where: {
        OR: [{ qr_token: token }, { matricule: token }],
      },
      include: {
        patient: {
          select: { id: true, matricule: true, first_name: true, last_name: true, birth_date: true, gender: true },
        },
        order: {
          select: { matricule: true, status: true },
        },
        results: {
          select: { test_name: true, value: true, unit: true, status: true },
        },
      },
    });

    if (!specimen) return null;

    return {
      matricule: specimen.matricule ?? null,
      type: specimen.type ?? null,
      container: specimen.container ?? null,
      status: specimen.status ?? null,
      collection_date: specimen.collection_date ?? null,
      patient: specimen.patient
        ? {
            id: specimen.patient.id,
            matricule: specimen.patient.matricule ?? null,
            first_name: specimen.patient.first_name ?? null,
            last_name: specimen.patient.last_name ?? null,
            birth_date: specimen.patient.birth_date ?? null,
            gender: specimen.patient.gender ?? null,
          }
        : null,
      order: specimen.order
        ? { matricule: specimen.order.matricule ?? null, status: specimen.order.status ?? null }
        : null,
      results: Array.isArray(specimen.results)
        ? specimen.results.map((r: any) => ({
            test_name: r.test_name ?? null,
            value: r.value ?? null,
            unit: r.unit ?? null,
            status: r.status ?? null,
          }))
        : [],
    };
  }
  async getStatistics(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = {
      laboratory_id,
    };

    if (dateFrom || dateTo) {
      where.collection_date = {};
      if (dateFrom) {
        where.collection_date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.collection_date.lte = new Date(dateTo);
      }
    }

    const [byStatus, byType, total] = await Promise.all([
      this.prisma.specimens.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.specimens.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.specimens.count({ where }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      byType: byType.map((t: any) => ({ type: t.type, count: t._count })),
    };
  }
}
