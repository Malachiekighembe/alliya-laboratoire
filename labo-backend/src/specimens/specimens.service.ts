import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { PatientsService } from '../patients/patients.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateSpecimenDto, UpdateSpecimenDto } from './specimens.dtos.js';

@Injectable()
export class SpecimensService {
  constructor(
    private readonly prisma: PrismaService,
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
        status: 'received',
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

    // Validation du workflow
    const validTransitions: Record<string, string[]> = {
      received: ['processing', 'rejected', 'discarded'],
      processing: ['completed', 'rejected', 'discarded'],
      completed: [],
      rejected: [],
      discarded: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException("Transition de statut invalide: " + existing.status + " -> " + status);
    }

    const data: any = { status };
    if (notes !== undefined) {
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

  async reject(id: string, laboratory_id: string, reason?: string) {
    return this.updateStatus(id, laboratory_id, "rejected", reason ? "Rejeté: " + reason : "Rejeté");
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
