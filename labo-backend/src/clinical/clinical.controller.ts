import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicalService } from './clinical.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import {
  CreateConsultationDto,
  CreatePrescriptionDto,
  SearchConsultationsDto,
  UpdateConsultationDto,
  UpdatePrescriptionDto,
} from './clinical.dtos.js';

@ApiTags('Clinical (consultations, prescriptions)')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  // --- Consultations ------------------------------------------------------
  @Get('consultations')
  @RequirePermissions('visits.read')
  async findConsultations(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchConsultationsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.clinicalService.findConsultations(laboratory_id, page, limit, filters);
    return ApiResponseDto.success(data);
  }

  @Get('consultations/:id')
  @RequirePermissions('visits.read')
  async findConsultation(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.clinicalService.findConsultation(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post('consultations')
  @RequirePermissions('visits.create')
  async createConsultation(
    @Body() dto: CreateConsultationDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.clinicalService.createConsultation(dto, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Consultation enregistree');
  }

  @Patch('consultations/:id')
  @RequirePermissions('visits.update')
  async updateConsultation(
    @Param('id') id: string,
    @Body() dto: UpdateConsultationDto,
    @CurrentLaboratory() laboratory_id: string,
  ) {
    const data = await this.clinicalService.updateConsultation(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Consultation mise a jour');
  }

  // --- Prescriptions ------------------------------------------------------
  @Get('prescriptions')
  @RequirePermissions('visits.read')
  async findPrescriptions(
    @CurrentLaboratory() laboratory_id: string,
    @Query('patient_id') patient_id?: string,
  ) {
    const data = await this.clinicalService.findPrescriptions(laboratory_id, patient_id);
    return ApiResponseDto.success(data);
  }

  @Get('prescriptions/:id')
  @RequirePermissions('visits.read')
  async findPrescription(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.clinicalService.findPrescription(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post('prescriptions')
  @RequirePermissions('orders.create')
  async createPrescription(
    @Body() dto: CreatePrescriptionDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.clinicalService.createPrescription(dto, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Ordonnance enregistree');
  }

  @Patch('prescriptions/:id')
  @RequirePermissions('orders.update')
  async updatePrescription(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentLaboratory() laboratory_id: string,
  ) {
    const data = await this.clinicalService.updatePrescription(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Ordonnance mise a jour');
  }

  /** Ordonnance → demande d'analyses (§5.3). */
  @Post('prescriptions/:id/convert-to-order')
  @RequirePermissions('orders.create')
  async convertToOrder(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.clinicalService.convertToOrder(id, laboratory_id, user_id);
    return ApiResponseDto.success(data, "Demande d'analyses creee");
  }
}