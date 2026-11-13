import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ResultsService } from './results.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  AmendResultDto,
  CancelResultDto,
  CreateResultDto,
  ReviewResultDto,
  SearchResultsDto,
  UpdateResultDto,
  ValidateResultDto,
} from './results.dtos.js';

@ApiTags('Results')
@ApiBearerAuth()
@Controller('results')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  @RequirePermissions('results.read')
  async findAll(
    @CurrentLaboratory() labId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: SearchResultsDto,
  ) {
    const result = await this.resultsService.findAll(labId, pagination, filters);
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

  @Get('pending-validation')
  @RequirePermissions('results.validate')
  async getPendingValidation(
    @CurrentLaboratory() labId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.resultsService.findPendingValidation(labId, Number(page), Number(limit));
    return new ApiResponseDto({
      success: true,
      data: result.items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(limit)),
        hasNext: Number(page) * Number(limit) < result.total,
        hasPrev: Number(page) > 1,
      },
    });
  }

  @Get('statistics')
  @RequirePermissions('results.statistics')
  async getStatistics(@CurrentLaboratory() labId: string) {
    const data = await this.resultsService.getStatistics(labId);
    return ApiResponseDto.success(data);
  }

  @Get('specimen/:specimenId')
  @RequirePermissions('results.read')
  async findBySpecimen(@Param('specimenId') specimenId: string, @CurrentLaboratory() labId: string) {
    const data = await this.resultsService.findBySpecimen(specimenId, labId);
    return ApiResponseDto.success(data);
  }

  @Get(':id/history')
  @RequirePermissions('results.read')
  async getHistory(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.resultsService.history(id, labId);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('results.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.resultsService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('results.create')
  async create(
    @Body() dto: CreateResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.resultsService.create(dto, labId, user.id);
    return ApiResponseDto.success(data, 'Résultat créé');
  }

  @Patch(':id')
  @RequirePermissions('results.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.resultsService.update(id, labId, dto, user.id);
    return ApiResponseDto.success(data, 'Résultat mis à jour');
  }

  /** Envoi en vérification (§8.3). */
  @Patch(':id/submit')
  @RequirePermissions('results.update')
  async submit(
    @Param('id') id: string,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.submit(id, labId, user_id);
    return ApiResponseDto.success(data, 'Résultat envoyé en vérification');
  }

  /** Historique des versions et paramètres (§9.3). */
  @Get(':id/history')
  @RequirePermissions('results.read')
  async history(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.resultsService.history(id, labId);
    return ApiResponseDto.success(data);
  }

  @Patch(':id/validate')
  @RequirePermissions('results.validate')
  async validate(
    @Param('id') id: string,
    @Body() dto: ValidateResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.resultsService.validate(id, labId, dto, user);
    return ApiResponseDto.success(data, 'Résultat validé et signé');
  }

  /** Demande de correction : retour technicien (§9.3). */
  @Patch(':id/request-correction')
  @RequirePermissions('results.validate')
  async requestCorrection(
    @Param('id') id: string,
    @Body() dto: ReviewResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.requestCorrection(id, labId, dto.reason, user_id);
    return ApiResponseDto.success(data, 'Correction demandée');
  }

  /** Demande de reprise : nouvelle analyse (§9.3). */
  @Patch(':id/request-rework')
  @RequirePermissions('results.validate')
  async requestRework(
    @Param('id') id: string,
    @Body() dto: ReviewResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.requestRework(id, labId, dto.reason, user_id);
    return ApiResponseDto.success(data, 'Reprise demandée');
  }

  @Patch(':id/reject')
  @RequirePermissions('results.validate')
  async rejectResult(
    @Param('id') id: string,
    @Body() dto: ReviewResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.reject(id, labId, dto.reason, user_id);
    return ApiResponseDto.success(data, 'Résultat rejeté');
  }

  @Patch(':id/amend')
  @RequirePermissions('results.amend')
  async amend(
    @Param('id') id: string,
    @Body() dto: AmendResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.amend(id, labId, dto, user_id);
    return ApiResponseDto.success(data, 'Résultat amendé');
  }

  @Patch(':id/cancel')
  @RequirePermissions('results.cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelResultDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.resultsService.cancel(id, labId, dto, user_id);
    return ApiResponseDto.success(data, 'Résultat annulé');
  }
}
