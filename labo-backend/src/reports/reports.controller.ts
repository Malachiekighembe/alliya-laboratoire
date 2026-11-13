import { Controller, Get, Header, Param, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService, normalizeReportStatus } from './reports.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { CreateReportDto, DeliverReportDto, SearchReportsDto } from './reports.dtos.js';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('dashboard.view')
  async getDashboard(
    @CurrentLaboratory() laboratory_id: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const data = await this.reportsService.getDashboard(laboratory_id, dateFrom, dateTo);
    return ApiResponseDto.success(data);
  }

  @Get('audit')
  @RequirePermissions('reports.view')
  async getAudit(
    @CurrentLaboratory() laboratory_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.reportsService.getAuditLogs(laboratory_id, Number(page), Number(limit));
    return ApiResponseDto.success(data);
  }

  @Get()
  @RequirePermissions('reports.view')
  async findAll(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchReportsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.reportsService.findAll(laboratory_id, page, limit, filters);
    return ApiResponseDto.success(data);
  }

  @Get('patient/:patientId')
  @RequirePermissions('reports.view')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentLaboratory() laboratory_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.reportsService.findByPatient(patientId, laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('reports.view')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.reportsService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get(':id/pdf')
  @RequirePermissions('reports.view')
  async getPdf(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string, @Res() res: Response) {
    const pdf = await this.reportsService.getPdf(id, laboratory_id);
    const report = await this.reportsService.findById(id, laboratory_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(report as any).matricule ?? 'rapport'}.pdf"`);
    res.end(pdf);
  }

  @Get(':id/deliveries')
  @RequirePermissions('reports.view')
  async findDeliveries(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.reportsService.findDeliveries(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  /** Génération du rapport PDF (§10.1). */
  @Post()
  @RequirePermissions('reports.generate')
  async generate(
    @Body() dto: CreateReportDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.reportsService.generate(dto, laboratory_id, user);
    return ApiResponseDto.success(
      { ...data, pdf_url: undefined },
      'Rapport généré',
    );
  }

  /** Remise du rapport au patient (§10.3). */
  @Post(':id/deliver')
  @RequirePermissions('reports.generate')
  async deliver(
    @Param('id') id: string,
    @Body() dto: DeliverReportDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.reportsService.deliver(id, laboratory_id, dto, user_id);
    return ApiResponseDto.success(data, `Rapport ${normalizeReportStatus('remis')}`);
  }
}