import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { CreateAppointmentDto, SearchAppointmentsDto, UpdateAppointmentDto } from './appointments.dtos.js';

@ApiTags('Rendez-vous')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @RequirePermissions('visits.read')
  async findAll(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchAppointmentsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.appointmentsService.findAll(laboratory_id, page, limit, filters);
    return ApiResponseDto.success(data);
  }

  @Get('patient/:patientId')
  @RequirePermissions('visits.read')
  async findByPatient(@Param('patientId') patientId: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.appointmentsService.findByPatient(patientId, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('visits.read')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.appointmentsService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('visits.create')
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.appointmentsService.create(dto, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Rendez-vous enregistre');
  }

  @Patch(':id')
  @RequirePermissions('visits.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentLaboratory() laboratory_id: string,
  ) {
    const data = await this.appointmentsService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Rendez-vous mis a jour');
  }

  @Delete(':id')
  @RequirePermissions('visits.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.appointmentsService.remove(id, laboratory_id);
    return ApiResponseDto.success(data, 'Rendez-vous supprime');
  }
}