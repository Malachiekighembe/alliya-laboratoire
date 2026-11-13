import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import {
  CreateAnalysisRunDto,
  SearchAnalysisRunsDto,
  UpdateAnalysisRunDto,
} from './analyses.dtos.js';

@ApiTags('Analyses')
@ApiBearerAuth()
@Controller('analyses')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get()
  @RequirePermissions('analyses.view')
  async findAll(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchAnalysisRunsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.analysesService.findAll(laboratory_id, page, limit, filters);
    return ApiResponseDto.success(data);
  }

  @Get('patient/:patientId')
  @RequirePermissions('analyses.view')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentLaboratory() laboratory_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.analysesService.findByPatient(patientId, laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('analyses.view')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.analysesService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('analyses.create')
  async create(
    @Body() dto: CreateAnalysisRunDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.analysesService.create(dto, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Analyse creee');
  }

  @Patch(':id/start')
  @RequirePermissions('analyses.update')
  async start(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.analysesService.start(id, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Analyse demarree');
  }

  @Patch(':id/suspend')
  @RequirePermissions('analyses.update')
  async suspend(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @Body('reason') reason?: string,
  ) {
    const data = await this.analysesService.suspend(id, laboratory_id, reason);
    return ApiResponseDto.success(data, 'Analyse suspendue');
  }

  @Patch(':id/resume')
  @RequirePermissions('analyses.update')
  async resume(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.analysesService.resume(id, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Analyse reprise');
  }

  @Patch(':id/complete')
  @RequirePermissions('analyses.update')
  async complete(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.analysesService.complete(id, laboratory_id);
    return ApiResponseDto.success(data, 'Analyse terminee');
  }

  @Patch(':id/rework')
  @RequirePermissions('analyses.update')
  async rework(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @Body('reason') reason?: string,
  ) {
    const data = await this.analysesService.rework(id, laboratory_id, reason);
    return ApiResponseDto.success(data, 'Analyse a reprendre');
  }

  @Patch(':id')
  @RequirePermissions('analyses.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnalysisRunDto,
    @CurrentLaboratory() laboratory_id: string,
  ) {
    const data = await this.analysesService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Analyse mise a jour');
  }

  @Delete(':id')
  @RequirePermissions('analyses.update')
  async cancel(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.analysesService.cancel(id, laboratory_id);
    return ApiResponseDto.success(data, 'Analyse annulee');
  }
}