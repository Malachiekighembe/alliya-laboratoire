import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateTestCatalogDto, UpdateTestCatalogDto } from './examinations.dtos.js';

const TEXT_FIELDS = [
  'category',
  'exam_type',
  'section',
  'sample_type',
  'container',
  'preparation',
  'method',
  'description',
  'unit',
  'reference_range',
] as const;

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createTestDto: CreateTestCatalogDto, laboratory_id: string) {
    const existing = await this.prisma.test_catalog.findUnique({
      where: {
        laboratory_id_code: {
          laboratory_id,
          code: createTestDto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Un examen avec ce code existe déjà pour ce laboratoire');
    }

    const data: any = {
      laboratory_id,
      code: createTestDto.code,
      name: createTestDto.name,
      price: createTestDto.price !== undefined ? createTestDto.price : null,
      duration_minutes: createTestDto.duration_minutes !== undefined ? createTestDto.duration_minutes : null,
      is_active: true,
    };

    for (const field of TEXT_FIELDS) {
      const value = (createTestDto as any)[field];
      data[field] = value !== undefined && value !== '' ? value : null;
    }

    const test = await this.prisma.test_catalog.create({ data });

    return test;
  }

  async findAll(
    laboratory_id: string,
    pagination: PaginationDto,
    search?: string,
    category?: string,
    includeInactive?: boolean,
    filters?: { exam_type?: string; section?: string; sample_type?: string },
  ) {
    const where: any = {
      laboratory_id,
    };

    if (!includeInactive) {
      where.is_active = true;
    }

    if (category) {
      where.category = category;
    }

    if (filters?.exam_type) {
      where.exam_type = filters.exam_type;
    }

    if (filters?.section) {
      where.section = filters.section;
    }

    if (filters?.sample_type) {
      where.sample_type = filters.sample_type;
    }

    if (search || pagination.search) {
      const searchTerm = search || pagination.search;
      where.OR = [
        { name: { contains: searchTerm } },
        { code: { contains: searchTerm } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.test_catalog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.test_catalog.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const test = await this.prisma.test_catalog.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!test) {
      throw new NotFoundException('Examen non trouvé');
    }

    return test;
  }

  async findByCode(code: string, laboratory_id: string) {
    const test = await this.prisma.test_catalog.findFirst({
      where: {
        code,
        laboratory_id,
      },
    });

    if (!test) {
      throw new NotFoundException('Examen non trouvé');
    }

    return test;
  }

  async update(id: string, laboratory_id: string, updateTestDto: UpdateTestCatalogDto) {
    const existing = await this.prisma.test_catalog.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Examen non trouvé');
    }

    if (updateTestDto.code && updateTestDto.code !== existing.code) {
      const codeExists = await this.prisma.test_catalog.findUnique({
        where: {
          laboratory_id_code: {
            laboratory_id,
            code: updateTestDto.code,
          },
        },
      });

      if (codeExists) {
        throw new ConflictException('Un examen avec ce code existe déjà pour ce laboratoire');
      }
    }

    const data: any = {};

    if (updateTestDto.code !== undefined) data.code = updateTestDto.code;
    if (updateTestDto.name !== undefined) data.name = updateTestDto.name;
    if (updateTestDto.price !== undefined) data.price = updateTestDto.price;
    if (updateTestDto.duration_minutes !== undefined) data.duration_minutes = updateTestDto.duration_minutes;
    if (updateTestDto.is_active !== undefined) data.is_active = updateTestDto.is_active;

    for (const field of TEXT_FIELDS) {
      const value = (updateTestDto as any)[field];
      if (value === undefined) continue;
      data[field] = value === '' ? null : value;
    }

    const test = await this.prisma.test_catalog.update({
      where: { id },
      data,
    });

    return test;
  }

  /** Suppression logique : les analyses historiques restent rattachées à l'examen. */
  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.test_catalog.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Examen non trouvé');
    }

    await this.prisma.test_catalog.update({
      where: { id },
      data: { is_active: false },
    });

    return { success: true };
  }

  /**
   * Valeurs distinctes réellement utilisées par le catalogue, par discipline.
   * Le client Supabase n'applique pas `distinct` : la déduplication est faite ici.
   */
  async getCategories(laboratory_id: string) {
    const tests = await this.prisma.test_catalog.findMany({
      where: { laboratory_id },
    });

    const unique = (values: any[]) =>
      Array.from(new Set(values.filter((v) => typeof v === 'string' && v.trim().length > 0))).sort((a, b) =>
        String(a).localeCompare(String(b)),
      );

    const rows = tests as any[];

    return {
      categories: unique(rows.map((t) => t.category)),
      exam_types: unique(rows.map((t) => t.exam_type)),
      sections: unique(rows.map((t) => t.section)),
      sample_types: unique(rows.map((t) => t.sample_type)),
    };
  }

  async getStatistics(laboratory_id: string) {
    const tests = await this.prisma.test_catalog.findMany({
      where: { laboratory_id },
      include: { order_items: true },
    });

    const stats = (tests as any[]).map((test) => ({
      test_id: test.id,
      code: test.code,
      name: test.name,
      category: test.category,
      exam_type: test.exam_type,
      usage_count: Array.isArray(test.order_items) ? test.order_items.length : 0,
    }));

    stats.sort((a, b) => b.usage_count - a.usage_count);

    return stats;
  }
}