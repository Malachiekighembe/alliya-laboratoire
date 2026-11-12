import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class ResultValidationsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(resultId: string, laboratory_id: string, validated_by_id: string, status: string, notes?: string) {
    const result = await this.prisma.results.findFirst({ where: { id: resultId, laboratory_id } });
    if (!result) {
      throw new NotFoundException("Resultat non trouve");
    }

    const validation = await this.prisma.result_validations.create({
      data: {
        laboratory_id,
        result_id: resultId,
        validated_by_id,
        status,
        comment: notes || null,
      },
    });

    await this.prisma.results.update({
      where: { id: resultId },
      data: { status: "validated", validated_by_id, validated_at: new Date() },
    });

    return validation;
  }

  async findAll(laboratory_id: string, page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { laboratory_id };

    if (filters?.result_id) where.result_id = filters.result_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.date_from || filters?.date_to) {
      where.created_at = {};
      if (filters.date_from) where.created_at.gte = new Date(filters.date_from);
      if (filters.date_to) where.created_at.lte = new Date(filters.date_to);
    }
    if (filters?.search) {
      where.OR = [
        { comment: { contains: filters.search } },
        { status: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.result_validations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.result_validations.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const validation = await this.prisma.result_validations.findFirst({
      where: { id, laboratory_id },
    });
    if (!validation) {
      throw new NotFoundException("Validation non trouvee");
    }
    return validation;
  }

  async findByResult(resultId: string, laboratory_id: string) {
    return this.prisma.result_validations.findMany({
      where: { result_id: resultId, laboratory_id },
      orderBy: { created_at: "desc" },
    });
  }

  async update(id: string, laboratory_id: string, status?: string, notes?: string) {
    const existing = await this.prisma.result_validations.findFirst({ where: { id, laboratory_id } });
    if (!existing) {
      throw new NotFoundException("Validation non trouvee");
    }
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.comment = notes;
    return this.prisma.result_validations.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.result_validations.findFirst({ where: { id, laboratory_id } });
    if (!existing) {
      throw new NotFoundException("Validation non trouvee");
    }
    await this.prisma.result_validations.delete({ where: { id } });
    return { success: true };
  }

  async getStatistics(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = { laboratory_id };
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) where.created_at.lte = new Date(dateTo);
    }
    const [byStatus, total] = await Promise.all([
      this.prisma.result_validations.groupBy({ by: ["status"], where, _count: true }),
      this.prisma.result_validations.count({ where }),
    ]);
    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
    };
  }
}
