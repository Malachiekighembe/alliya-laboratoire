import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { ExaminationsService } from './examinations.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateTestCatalogDto, SearchExaminationsDto, UpdateTestCatalogDto } from './examinations.dtos.js';

@ApiTags('Examinations')
@ApiBearerAuth()
@Controller('examinations')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get()
  @RequirePermissions('examinations.read')
  async findAll(
    @CurrentLaboratory() labId: string,
    @Query() pagination: PaginationDto,
    @Query() searchDto: SearchExaminationsDto,
  ) {
const includeInactive = searchDto.include_inactive === true;
    const result = await this.examinationsService.findAll(
      labId,
      pagination,
      searchDto.search,
      searchDto.category,
      includeInactive,
      {
        exam_type: searchDto.exam_type,
        section: searchDto.section,
        sample_type: searchDto.sample_type,
      },
    );
    return new ApiResponseDto({
      success: true,
      data: result.items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < result.total,
        hasPrev: pagination.page > 1,
      },
    });
  }

  @Get('categories')
  @RequirePermissions('examinations.read')
  async getCategories(@CurrentLaboratory() labId: string) {
    const data = await this.examinationsService.getCategories(labId);
    return ApiResponseDto.success(data);
  }

  @Get('statistics')
  @RequirePermissions('examinations.statistics')
  async getStatistics(@CurrentLaboratory() labId: string) {
    const data = await this.examinationsService.getStatistics(labId);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('examinations.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.examinationsService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('examinations.create')
  async create(@Body() dto: CreateTestCatalogDto, @CurrentLaboratory() labId: string) {
    const data = await this.examinationsService.create(dto, labId);
    return ApiResponseDto.success(data, 'Examen créé');
  }

  @Patch(':id')
  @RequirePermissions('examinations.update')
  async update(@Param('id') id: string, @Body() dto: UpdateTestCatalogDto, @CurrentLaboratory() labId: string) {
    const data = await this.examinationsService.update(id, labId, dto);
    return ApiResponseDto.success(data, 'Examen mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('examinations.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    await this.examinationsService.remove(id, labId);
    return ApiResponseDto.success(null, 'Examen supprimé');
  }
}
