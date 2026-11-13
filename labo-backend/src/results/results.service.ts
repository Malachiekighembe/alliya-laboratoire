import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  AmendResultDto,
  CancelResultDto,
  CreateResultDto,
  ResultParameterDto,
  SearchResultsDto,
  UpdateResultDto,
  ValidateResultDto,
} from './results.dtos.js';

/** Statuts §11.1 : résultat. */
export const RESULT_STATUSES = ['brouillon', 'en_verification', 'a_corriger', 'valide', 'rejete', 'annule'] as const;

const RESULT_ALIASES: Record<string, string> = {
  preliminary: 'brouillon',
  draft: 'brouillon',
  pending: 'brouillon',
  in_review: 'en_verification',
  submitted: 'en_verification',
  to_correct: 'a_corriger',
  correction: 'a_corriger',
  validated: 'valide',
  amended: 'valide',
  rejected: 'rejete',
  cancelled: 'annule',
  canceled: 'annule',
};

/** Rôles autorisés à valider un résultat biologique (§9). */
const VALIDATOR_ROLES = ['biologist', 'doctor', 'super_admin', 'admin', 'lab_manager'];

export function normalizeResultStatus(status?: string | null): string {
  if (!status) return 'brouillon';
  const key = String(status).toLowerCase();
  return RESULT_ALIASES[key] ?? key;
}

const USER_SELECT = { id: true, first_name: true, last_name: true, email: true };
const RELATIONS = {
  specimen: { include: { patient: true } },
  test_catalog: true,
  order_item: true,
  performed_by: { select: USER_SELECT },
  validated_by: { select: USER_SELECT },
};

@Injectable()
export class ResultsService {
  constructor(
    private prisma: DatabaseService,
    private metricUtil: MetricUtil,
  ) {}

  /** Interdit la validation par un technicien ou un laborantin (§9, §14). */
  private assertCanValidate(user?: { roles?: string[] } | null) {
    const roles = (user?.roles ?? []).map((r) => String(r).toLowerCase());
    if (roles.length === 0) return;
    if (!roles.some((role) => VALIDATOR_ROLES.includes(role))) {
      throw new ForbiddenException(
        'Seul un biologiste (ou un medecin) autorise peut valider un resultat',
      );
    }
  }

  private async logRevision(
    result: any,
    laboratory_id: string,
    changeType: string,
    changedById: string,
    comment?: string,
  ) {
    await this.prisma.result_revisions.create({
      data: {
        laboratory_id,
        result_id: result.id,
        version: result.version ?? 1,
        change_type: changeType,
        value: result.value ?? null,
        unit: result.unit ?? null,
        reference_range: result.reference_range ?? null,
        status: normalizeResultStatus(result.status),
        previous_value: null,
        comment: comment ?? null,
        changed_by_id: changedById,
      },
    });
  }

  private async replaceParameters(resultId: string, laboratory_id: string, parameters?: ResultParameterDto[]) {
    if (!parameters) return;
    const existing = await this.prisma.result_parameters.findMany({
      where: { result_id: resultId, laboratory_id },
    });
    for (const row of existing) {
      await this.prisma.result_parameters.delete({ where: { id: (row as any).id } });
    }
    for (let index = 0; index < parameters.length; index++) {
      const parameter = parameters[index];
      await this.prisma.result_parameters.create({
        data: {
          laboratory_id,
          result_id: resultId,
          name: parameter.name,
          value: parameter.value ?? null,
          unit: parameter.unit ?? null,
          reference_range: parameter.reference_range ?? null,
          flag: parameter.flag ?? null,
          method: parameter.method ?? null,
          position: index,
        },
      });
    }
  }

  async create(dto: CreateResultDto, laboratory_id: string, performed_by_id: string) {
    const specimen = await this.prisma.specimens.findFirst({
      where: { id: dto.specimen_id, laboratory_id },
    });
    if (!specimen) throw new NotFoundException('Echantillon non trouve');

    const testCatalog = await this.prisma.test_catalog.findFirst({
      where: { id: dto.test_catalog_id, laboratory_id },
    });
    if (!testCatalog) throw new NotFoundException('Analyse non trouvee dans le catalogue');

    const matricule = await this.metricUtil.generateResultMatricule(laboratory_id);

    const result = await this.prisma.results.create({
      data: {
        laboratory_id,
        matricule,
        specimen_id: dto.specimen_id,
        patient_id: (specimen as any).patient_id,
        visit_id: (specimen as any).visit_id ?? null,
        order_item_id: dto.order_item_id ?? null,
        analysis_run_id: dto.analysis_run_id ?? null,
        test_catalog_id: dto.test_catalog_id,
        performed_by_id,
        value: dto.value ?? null,
        unit: dto.unit ?? (testCatalog as any).unit ?? null,
        reference_range: dto.reference_range ?? (testCatalog as any).reference_range ?? null,
        result_type: dto.result_type ?? 'numeric',
        qualitative_value: dto.qualitative_value ?? null,
        observations: dto.observations ?? null,
        method: dto.method ?? (testCatalog as any).method ?? null,
        status: 'brouillon',
        version: 1,
      },
      include: RELATIONS,
    });

    await this.replaceParameters((result as any).id, laboratory_id, dto.parameters);
    await this.logRevision(result, laboratory_id, 'create', performed_by_id, dto.notes);

    return this.findById((result as any).id, laboratory_id);
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, filters?: SearchResultsDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.specimen_id) where.specimen_id = filters.specimen_id;
    if (filters?.test_catalog_id) where.test_catalog_id = filters.test_catalog_id;
    if (filters?.patient_id) where.patient_id = filters.patient_id;
    if (filters?.status) {
      where.status = normalizeResultStatus(filters.status);
    }

    const [items, total] = await Promise.all([
      this.prisma.results.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: RELATIONS,
      }),
      this.prisma.results.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const result = await this.prisma.results.findFirst({
      where: { id, laboratory_id },
      include: RELATIONS,
    });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const [parameters, revisions] = await Promise.all([
      this.prisma.result_parameters.findMany({
        where: { result_id: id, laboratory_id },
        orderBy: { position: 'asc' },
      }),
      this.prisma.result_revisions.findMany({
        where: { result_id: id, laboratory_id },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    return { ...(result as any), parameters, revisions };
  }

  async findBySpecimen(specimenId: string, laboratory_id: string) {
    const specimen = await this.prisma.specimens.findFirst({ where: { id: specimenId, laboratory_id } });
    if (!specimen) throw new NotFoundException('Echantillon non trouve');

    return this.prisma.results.findMany({
      where: { specimen_id: specimenId, laboratory_id },
      orderBy: { created_at: 'asc' },
      include: RELATIONS,
    });
  }

  /** File d'attente du biologiste (§9.1) : résultats en vérification ou à corriger. */
  async findPendingValidation(laboratory_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.results.findMany({
        where: { laboratory_id, status: { in: ['en_verification', 'a_corriger'] } },
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: RELATIONS,
      }),
      this.prisma.results.count({ where: { laboratory_id, status: { in: ['en_verification', 'a_corriger'] } } }),
    ]);
    return { items, total };
  }

  async history(id: string, laboratory_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const [revisions, parameters] = await Promise.all([
      this.prisma.result_revisions.findMany({
        where: { result_id: id, laboratory_id },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.result_parameters.findMany({
        where: { result_id: id, laboratory_id },
        orderBy: { position: 'asc' },
      }),
    ]);

    return { result, revisions, parameters };
  }

  async update(id: string, laboratory_id: string, dto: UpdateResultDto, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const status = normalizeResultStatus((result as any).status);
    if (status === 'valide') {
      throw new ForbiddenException('Un resultat valide ne peut plus etre modifie. Utilisez "amender".');
    }
    if (status === 'annule') {
      throw new ForbiddenException('Un resultat annule ne peut pas etre modifie');
    }

    const data: any = {};
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.reference_range !== undefined) data.reference_range = dto.reference_range;
    if (dto.result_type !== undefined) data.result_type = dto.result_type;
    if (dto.qualitative_value !== undefined) data.qualitative_value = dto.qualitative_value;
    if (dto.observations !== undefined) data.observations = dto.observations;
    if (dto.method !== undefined) data.method = dto.method;

    await this.logRevision(result, laboratory_id, 'update', user_id, dto.notes);
    await this.prisma.results.update({ where: { id: result.id }, data });
    await this.replaceParameters(result.id, laboratory_id, dto.parameters);

    return this.findById(result.id, laboratory_id);
  }

  /** Enregistrement comme brouillon puis envoi en vérification (§8.3). */
  async submit(id: string, laboratory_id: string, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const status = normalizeResultStatus((result as any).status);
    if (!['brouillon', 'a_corriger'].includes(status)) {
      throw new BadRequestException(`Envoi en verification impossible depuis le statut ${status}`);
    }

    await this.logRevision(result, laboratory_id, 'submit', user_id, 'Envoi en verification');
    await this.prisma.results.update({
      where: { id: result.id },
      data: { status: 'en_verification', reported_at: new Date().toISOString() },
    });
    return this.findById(result.id, laboratory_id);
  }

  /** Validation biologique et signature (§9.4). */
  async validate(id: string, laboratory_id: string, dto: ValidateResultDto, user: any) {
    this.assertCanValidate(user);

    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const status = normalizeResultStatus((result as any).status);
    if (status === 'valide') throw new BadRequestException('Ce resultat est deja valide');
    if (status === 'annule') throw new ForbiddenException('Un resultat annule ne peut pas etre valide');
    if (status === 'rejete') throw new ForbiddenException('Un resultat rejete ne peut pas etre valide');

    const userId = user?.id ?? (result as any).performed_by_id ?? null;
    await this.logRevision(result, laboratory_id, 'validate', userId, dto.notes ?? 'Validation biologique');

    const validated = await this.prisma.results.update({
      where: { id: result.id },
      data: {
        status: 'valide',
        validated_by_id: userId,
        validated_at: new Date().toISOString(),
      },
      include: RELATIONS,
    });

    const validation = await this.prisma.result_validations.create({
      data: {
        laboratory_id,
        result_id: result.id,
        validated_by_id: userId,
        status: 'valide',
        decision: 'valide',
        comment: dto.notes ?? null,
        signature: dto.signature ?? null,
        validated_at: new Date().toISOString(),
      },
    });

    return { ...(validated as any), validation };
  }

  /** Demande de correction : retour au technicien (§9.3). */
  async requestCorrection(id: string, laboratory_id: string, reason: string, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    const status = normalizeResultStatus((result as any).status);
    if (status === 'valide') throw new ForbiddenException('Un resultat valide ne peut plus etre corrige');

    await this.logRevision(result, laboratory_id, 'correction', user_id, reason);
    await this.prisma.results.update({ where: { id: result.id }, data: { status: 'a_corriger' } });

    await this.prisma.result_validations.create({
      data: {
        laboratory_id,
        result_id: result.id,
        validated_by_id: user_id,
        status: 'a_corriger',
        decision: 'a_corriger',
        comment: reason,
      },
    });

    return this.findById(result.id, laboratory_id);
  }

  /** Reprise : nouvelle analyse demandée (§9.3). */
  async requestRework(id: string, laboratory_id: string, reason: string, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    await this.logRevision(result, laboratory_id, 'reprise', user_id, reason);

    const run = (result as any).analysis_run_id
      ? await this.prisma.analysis_runs.findFirst({ where: { id: (result as any).analysis_run_id, laboratory_id } })
      : null;
    if (run) {
      await this.prisma.analysis_runs.update({ where: { id: (run as any).id }, data: { status: 'a_reprendre' } });
    }

    await this.prisma.results.update({ where: { id: result.id }, data: { status: 'a_corriger' } });
    return this.findById(result.id, laboratory_id);
  }

  async reject(id: string, laboratory_id: string, reason: string, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');

    await this.logRevision(result, laboratory_id, 'reject', user_id, reason);
    await this.prisma.results.update({ where: { id: result.id }, data: { status: 'rejete' } });

    await this.prisma.result_validations.create({
      data: {
        laboratory_id,
        result_id: result.id,
        validated_by_id: user_id,
        status: 'rejete',
        decision: 'rejete',
        comment: reason,
      },
    });

    return this.findById(result.id, laboratory_id);
  }

  /** Correction après validation : nouvelle version, l'ancienne est conservee (§9.3). */
  async amend(id: string, laboratory_id: string, dto: AmendResultDto, user_id: string) {
    const original = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!original) throw new NotFoundException('Resultat non trouve');
    if (normalizeResultStatus((original as any).status) === 'annule') {
      throw new ForbiddenException('Un resultat annule ne peut pas etre amende');
    }

    const version = Number((original as any).version ?? 1) + 1;
    const matricule = await this.metricUtil.generateResultMatricule(laboratory_id);

    await this.logRevision(original, laboratory_id, 'amend', user_id, dto.reason ?? 'Amendement');

    const amended = await this.prisma.results.create({
      data: {
        laboratory_id,
        matricule,
        specimen_id: (original as any).specimen_id,
        patient_id: (original as any).patient_id ?? null,
        visit_id: (original as any).visit_id ?? null,
        order_item_id: (original as any).order_item_id ?? null,
        analysis_run_id: (original as any).analysis_run_id ?? null,
        test_catalog_id: (original as any).test_catalog_id,
        performed_by_id: (original as any).performed_by_id ?? user_id,
        validated_by_id: user_id,
        value: dto.value ?? (original as any).value ?? null,
        unit: dto.unit ?? (original as any).unit ?? null,
        reference_range: dto.reference_range ?? (original as any).reference_range ?? null,
        result_type: dto.result_type ?? (original as any).result_type ?? 'numeric',
        qualitative_value: dto.qualitative_value ?? (original as any).qualitative_value ?? null,
        observations: dto.observations ?? (original as any).observations ?? null,
        method: (original as any).method ?? null,
        status: 'valide',
        version,
        validated_at: new Date().toISOString(),
      },
      include: RELATIONS,
    });

    await this.replaceParameters((amended as any).id, laboratory_id, dto.parameters);
    return this.findById((amended as any).id, laboratory_id);
  }

  async cancel(id: string, laboratory_id: string, dto: CancelResultDto, user_id: string) {
    const result = await this.prisma.results.findFirst({ where: { id, laboratory_id } });
    if (!result) throw new NotFoundException('Resultat non trouve');
    if (normalizeResultStatus((result as any).status) === 'annule') {
      throw new BadRequestException('Ce resultat est deja annule');
    }

    await this.logRevision(result, laboratory_id, 'cancel', user_id, dto.reason ?? 'Annulation');
    const cancelled = await this.prisma.results.update({
      where: { id: result.id },
      data: { status: 'annule' },
      include: RELATIONS,
    });
    return cancelled;
  }

  async getStatistics(laboratory_id: string) {
    const rows = await this.prisma.results.findMany({ where: { laboratory_id } });
    const byStatus: Record<string, number> = {};
    for (const row of rows as any[]) {
      const status = normalizeResultStatus(row.status);
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    return {
      total: rows.length,
      pending: (byStatus['en_verification'] ?? 0) + (byStatus['a_corriger'] ?? 0),
      validated: byStatus['valide'] ?? 0,
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    };
  }
}