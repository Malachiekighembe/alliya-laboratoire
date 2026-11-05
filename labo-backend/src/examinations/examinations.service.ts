import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateTestCatalogDto, UpdateTestCatalogDto } from './examinations.dtos.js';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ConflictException('Un examen avec ce code existe d�j� pour ce laboratoire');
    }

    const data: any = {
      laboratory_id,
      code: createTestDto.code,
      name: createTestDto.name,
      category: createTestDto.category || null,
      unit: createTestDto.unit || null,
      reference_range: createTestDto.reference_range || null,
      price: createTestDto.price !== undefined ? createTestDto.price : null,
      duration_minutes: createTestDto.duration_minutes !== undefined ? createTestDto.duration_minutes : null,
      is_active: true,
    };

    const test = await this.prisma.test_catalog.create({
      data,
    });

    return test;
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, search?: string, category?: string, includeInactive?: boolean) {
    const where: any = {
      laboratory_id,
    };

    if (!includeInactive) {
      where.is_active = true;
    }

    if (category) {
      where.category = category;
    }

    if (search || pagination.search) {
      const searchTerm = search || pagination.search;
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
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
      throw new NotFoundException('Examen non trouv�');
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
      throw new NotFoundException('Examen non trouv�');
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
      throw new NotFoundException('Examen non trouv�');
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
        throw new ConflictException('Un examen avec ce code existe d�j� pour ce laboratoire');
      }
    }

    const data: any = {};

    if (updateTestDto.code !== undefined) data.code = updateTestDto.code;
    if (updateTestDto.name !== undefined) data.name = updateTestDto.name;
    if (updateTestDto.category !== undefined) data.category = updateTestDto.category || null;
    if (updateTestDto.unit !== undefined) data.unit = updateTestDto.unit || null;
    if (updateTestDto.reference_range !== undefined) data.reference_range = updateTestDto.reference_range || null;
    if (updateTestDto.price !== undefined) data.price = updateTestDto.price;
    if (updateTestDto.duration_minutes !== undefined) data.duration_minutes = updateTestDto.duration_minutes;
    if (updateTestDto.is_active !== undefined) data.is_active = updateTestDto.is_active;

    const test = await this.prisma.test_catalog.update({
      where: { id },
      data,
    });

    return test;
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.test_catalog.findFirst({
      where: {
        id,
        laboratory_id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Examen non trouv�');
    }

    await this.prisma.test_catalog.update({
      where: { id },
      data: {
        is_active: false,
      },
    });

    return { success: true };
  }

  async getCategories(laboratory_id: string) {
    const categories = await this.prisma.test_catalog.findMany({
      where: {
        laboratory_id,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map((c: any) => c.category).filter((c: any) => c !== null);
  }

  async getStatistics(laboratory_id: string) {
    const tests = await this.prisma.test_catalog.findMany({
      where: {
        laboratory_id,
      },
      include: {
        order_items: true,
      },
    });

    const stats = tests.map((test: any) => ({
      test_id: test.id,
      code: test.code,
      name: test.name,
      category: test.category,
      usage_count: test.order_items.length,
    }));

    stats.sort((a: any, b: any) => b.usage_count - a.usage_count);

    return stats;
  }
}
