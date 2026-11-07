import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { SpecimensService } from '../specimens/specimens.service.js';
import { ExaminationsService } from '../examinations/examinations.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { AmendResultDto, CreateResultDto, SearchResultsDto, UpdateResultDto } from './results.dtos.js';

@Injectable()
export class ResultsService {
  constructor(
    private prisma: DatabaseService,
    private metricUtil: MetricUtil,
    private specimensService: SpecimensService,
    private examinationsService: ExaminationsService,
  ) {}

  async create(createResultDto: CreateResultDto, laboratory_id: string, performed_by_id: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: { id: createResultDto.specimen_id, laboratory_id, deleted_at: null },
    });
    if (!specimen) {
      throw new NotFoundException('�chantillon non trouv�');
    }

    const testCatalog = await this.prisma.test_catalog.findFirst({
      where: { id: createResultDto.test_catalog_id, laboratory_id, is_active: true },
    });
    if (!testCatalog) {
      throw new NotFoundException('Examen non trouv� dans le catalogue');
    }

    if (createResultDto.order_item_id) {
      const orderItem = await this.prisma.order_items.findFirst({
        where: { id: createResultDto.order_item_id, laboratory_id },
      });
      if (!orderItem) {
        throw new NotFoundException('Ligne de commande non trouv�e');
      }
    }

    const matricule = await this.metricUtil.generateResultMatricule(laboratory_id);

    const result = await this.prisma.results.create({
      data: {
        laboratory_id,
        matricule,
        specimen_id: createResultDto.specimen_id,
        order_item_id: createResultDto.order_item_id,
        test_catalog_id: createResultDto.test_catalog_id,
        performed_by_id,
        value: createResultDto.value,
        unit: createResultDto.unit || testCatalog.unit,
        reference_range: createResultDto.reference_range || testCatalog.reference_range,
        status: 'preliminary',
        version: 1,
      },
      include: {
        specimen: true,
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true, email: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });

    return result;
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, filters?: SearchResultsDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { laboratory_id, deleted_at: null };

    if (filters?.specimen_id) {
      where.specimen_id = filters.specimen_id;
    }
    if (filters?.test_catalog_id) {
      where.test_catalog_id = filters.test_catalog_id;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.patient_id) {
      where.specimen = { patient_id: filters.patient_id };
    }

    const [items, total] = await Promise.all([
      this.prisma.results.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          specimen: { include: { patient: true } },
          test_catalog: true,
          performed_by: { select: { id: true, first_name: true, last_name: true, email: true } },
          validated_by: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
      }),
      this.prisma.results.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const result = await this.prisma.results.findFirst({
      where: { id, laboratory_id, deleted_at: null },
      include: {
        specimen: { include: { patient: true } },
        test_catalog: true,
        order_item: true,
        performed_by: { select: { id: true, first_name: true, last_name: true, email: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });

    if (!result) {
      throw new NotFoundException('R�sultat non trouv�');
    }

    // Get history (other versions)
    const history = await this.prisma.results.findMany({
      where: {
        laboratory_id,
        specimen_id: result.specimen_id,
        test_catalog_id: result.test_catalog_id,
        deleted_at: null,
        id: { not: result.id },
      },
      orderBy: { version: 'asc' },
      include: {
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return { ...result, history };
  }

  async findBySpecimen(specimenId: string, laboratory_id: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: { id: specimenId, laboratory_id },
    });
    if (!specimen) {
      throw new NotFoundException('�chantillon non trouv�');
    }

    const results = await this.prisma.results.findMany({
      where: { specimen_id: specimenId, laboratory_id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      include: {
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return results;
  }

  async update(id: string, laboratory_id: string, updateResultDto: UpdateResultDto, performed_by_id: string) {
    const result = await this.prisma.results.findFirst({
      where: { id, laboratory_id, deleted_at: null },
    });

    if (!result) {
      throw new NotFoundException('R�sultat non trouv�');
    }

    if (result.status === 'validated') {
      throw new ForbiddenException('Un r�sultat valid� ne peut �tre modifi�. Utilisez la fonction "amender" pour cr�er une nouvelle version.');
    }

    if (result.status === 'cancelled') {
      throw new ForbiddenException('Un r�sultat annul� ne peut pas �tre modifi�');
    }

    const updated = await this.prisma.results.update({
      where: { id: result.id },
      data: {
        value: updateResultDto.value !== undefined ? updateResultDto.value : result.value,
        unit: updateResultDto.unit !== undefined ? updateResultDto.unit : result.unit,
        reference_range: updateResultDto.reference_range !== undefined ? updateResultDto.reference_range : result.reference_range,
        performed_by_id: result.performed_by_id || performed_by_id,
      },
      include: {
        specimen: true,
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return updated;
  }

  async validate(id: string, laboratory_id: string, validated_by_id: string) {
    const result = await this.prisma.results.findFirst({
      where: { id, laboratory_id, deleted_at: null },
    });

    if (!result) {
      throw new NotFoundException('R�sultat non trouv�');
    }

    if (result.status === 'validated') {
      throw new BadRequestException('Ce r�sultat est d�j� valid�');
    }

    if (result.status === 'cancelled') {
      throw new ForbiddenException('Un r�sultat annul� ne peut pas �tre valid�');
    }

    const validated = await this.prisma.results.update({
      where: { id: result.id },
      data: {
        status: 'validated',
        validated_by_id,
        validated_at: new Date(),
        version: result.version || 1,
      },
      include: {
        specimen: true,
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return validated;
  }

  async amend(id: string, laboratory_id: string, amendDto: AmendResultDto, performed_by_id: string) {
    const originalResult = await this.prisma.results.findFirst({
      where: { id, laboratory_id, deleted_at: null },
    });

    if (!originalResult) {
      throw new NotFoundException('R�sultat non trouv�');
    }

    if (originalResult.status === 'cancelled') {
      throw new ForbiddenException('Un r�sultat annul� ne peut pas �tre amend�');
    }

    // Create new version
    const newVersion = originalResult.version + 1;
    const matricule = await this.metricUtil.generateResultMatricule(laboratory_id);

    const amended = await this.prisma.results.create({
      data: {
        laboratory_id,
        matricule,
        specimen_id: originalResult.specimen_id,
        order_item_id: originalResult.order_item_id,
        test_catalog_id: originalResult.test_catalog_id,
        performed_by_id,
        validated_by_id: originalResult.validated_by_id || performed_by_id,
        value: amendDto.value,
        unit: amendDto.unit || originalResult.unit,
        reference_range: amendDto.reference_range || originalResult.reference_range,
        status: 'validated',
        version: newVersion,
        validated_at: new Date(),
      },
      include: {
        specimen: true,
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return amended;
  }

  async cancel(id: string, laboratory_id: string, reason?: string) {
    const result = await this.prisma.results.findFirst({
      where: { id, laboratory_id, deleted_at: null },
    });

    if (!result) {
      throw new NotFoundException('R�sultat non trouv�');
    }

    if (result.status === 'cancelled') {
      throw new BadRequestException('Ce r�sultat est d�j� annul�');
    }

    const cancelled = await this.prisma.results.update({
      where: { id: result.id },
      data: {
        status: 'cancelled',
      },
      include: {
        specimen: true,
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return cancelled;
  }

  async getHistory(specimenId: string, laboratory_id: string, test_catalog_id?: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: { id: specimenId, laboratory_id },
    });
    if (!specimen) {
      throw new NotFoundException('�chantillon non trouv�');
    }

    const where: any = {
      laboratory_id,
      specimen_id: specimenId,
      deleted_at: null,
    };

    if (test_catalog_id) {
      where.test_catalog_id = test_catalog_id;
    }

    const history = await this.prisma.results.findMany({
      where,
      orderBy: [{ test_catalog_id: 'asc' }, { version: 'asc' }],
      include: {
        test_catalog: true,
        performed_by: { select: { id: true, first_name: true, last_name: true } },
        validated_by: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return history;
  }

  async getPendingValidation(laboratory_id: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.results.findMany({
        where: {
          laboratory_id,
          status: 'preliminary',
          deleted_at: null,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
          specimen: { include: { patient: true } },
          test_catalog: true,
          performed_by: { select: { id: true, first_name: true, last_name: true } },
        },
      }),
      this.prisma.results.count({
        where: {
          laboratory_id,
          status: 'preliminary',
          deleted_at: null,
        },
      }),
    ]);

    return { items, total };
  }

  async getStatistics(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = { laboratory_id, deleted_at: null };

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo);
      }
    }

    const [total, byStatus, byTest] = await Promise.all([
      this.prisma.results.count({ where }),
      this.prisma.results.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.results.groupBy({
        by: ['test_catalog_id'],
        where,
        _count: true,
        orderBy: { _count: { test_catalog_id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      topTests: byTest,
    };
  }
}
