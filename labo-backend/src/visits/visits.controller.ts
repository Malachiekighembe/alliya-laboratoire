import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { VisitsService } from './visits.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateVisitDto, CreateOrderDto, UpdateVisitDto, CancelVisitDto, CompleteVisitDto, SearchVisitsDto } from './visits.dtos.js';

@ApiTags('Visits')
@ApiBearerAuth()
@Controller('visits')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @RequirePermissions('visits.read')
  async findAll(@CurrentLaboratory() labId: string, @Query() pagination: PaginationDto, @Query() filters: SearchVisitsDto) {
    const result = await this.visitsService.findAll(labId, pagination, filters);
    return ApiResponseDto.success(result.items);
  }

  @Get('statistics')
  @RequirePermissions('visits.statistics')
  async statistics(@CurrentLaboratory() labId: string, @Query('date_from') df?: string, @Query('date_to') dt?: string) {
    const data = await this.visitsService.getStatistics(labId, df, dt);
    return ApiResponseDto.success(data);
  }

  @Get('patient/:patientId')
  @RequirePermissions('visits.read')
  async byPatient(@Param('patientId') patientId: string, @CurrentLaboratory() labId: string, @Query() pagination: PaginationDto) {
    const result = await this.visitsService.findByPatient(patientId, labId, pagination);
    return ApiResponseDto.success(result.items);
  }

  @Get(':id')
  @RequirePermissions('visits.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.visitsService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Get(':id/orders')
  @RequirePermissions('visits.read')
  async orders(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.visitsService.getOrdersByVisit(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('visits.create')
  async create(@Body() dto: CreateVisitDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const data = await this.visitsService.create(dto, labId, user.id);
    return ApiResponseDto.success(data, 'Visite créée');
  }

  @Post(':id/orders')
  @RequirePermissions('visits.orders.manage')
  async createOrder(@Param('id') id: string, @Body() dto: CreateOrderDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    dto.visit_id = id;
    const data = await this.visitsService.createOrder(dto, labId, user.id);
    return ApiResponseDto.success(data, 'Demande créée');
  }

  @Patch(':id')
  @RequirePermissions('visits.update')
  async update(@Param('id') id: string, @Body() dto: UpdateVisitDto, @CurrentLaboratory() labId: string) {
    const data = await this.visitsService.update(id, labId, dto);
    return ApiResponseDto.success(data, 'Visite mise à jour');
  }

  @Patch(':id/cancel')
  @RequirePermissions('visits.cancel')
  async cancel(@Param('id') id: string, @Body() dto: CancelVisitDto, @CurrentLaboratory() labId: string) {
    const data = await this.visitsService.cancel(id, labId, dto.reason);
    return ApiResponseDto.success(data, 'Visite annulée');
  }

  @Patch(':id/complete')
  @RequirePermissions('visits.complete')
  async complete(@Param('id') id: string, @Body() dto: CompleteVisitDto, @CurrentLaboratory() labId: string) {
    const data = await this.visitsService.complete(id, labId);
    return ApiResponseDto.success(data, 'Visite complétée');
  }

  @Delete(':id')
  @RequirePermissions('visits.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    await this.visitsService.remove(id, labId);
    return ApiResponseDto.success(null, 'Visite supprimée');
  }
}
