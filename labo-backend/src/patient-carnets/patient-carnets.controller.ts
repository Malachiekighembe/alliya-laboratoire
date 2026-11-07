import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { PatientCarnetsService } from './patient-carnets.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CreatePatientCarnetDto, UpdatePatientCarnetDto } from './patient-carnets.dtos.js';

@ApiTags('Patient Carnets')
@ApiBearerAuth()
@Controller('patient-carnets')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class PatientCarnetsController {
  constructor(private readonly carnetService: PatientCarnetsService) {}

  @Get('patient/:patientId')
  @RequirePermissions('patients.read')
  async getByPatient(
    @Param('patientId') patientId: string,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.carnetService.getCarnetWithVisits(labId, patientId);
    return ApiResponseDto.success(data, 'Carnet récupéré');
  }

  @Get(':id')
  @RequirePermissions('patients.read')
  async getById(
    @Param('id') id: string,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.carnetService.getCarnetById(id, labId);
    return ApiResponseDto.success(data, 'Carnet récupéré');
  }

  @Post()
  @RequirePermissions('patients.create')
  async create(
    @Body() dto: CreatePatientCarnetDto,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.carnetService.createCarnet(labId, dto.patient_id);
    return ApiResponseDto.success(data, 'Carnet créé');
  }

  @Patch(':id')
  @RequirePermissions('patients.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientCarnetDto,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.carnetService.update(id, labId, dto);
    return ApiResponseDto.success(data, 'Carnet mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('patients.delete')
  async remove(
    @Param('id') id: string,
    @CurrentLaboratory() labId: string,
  ) {
    await this.carnetService.remove(id, labId);
    return ApiResponseDto.success(null, 'Carnet supprimé');
  }
}
