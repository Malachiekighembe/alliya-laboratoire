import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { PatientsService } from './patients.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreatePatientContactDto, CreatePatientDto, UpdatePatientContactDto, UpdatePatientDto } from './patients.dtos.js';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @RequirePermissions('patients.read')
  async findAll(@CurrentLaboratory() labId: string, @Query() pagination: PaginationDto, @Query('search') search?: string) {
    const result = await this.patientsService.findAll(labId, pagination, search);
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

  @Get('search')
  @RequirePermissions('patients.read')
  async search(@Query('q') q: string, @CurrentLaboratory() labId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const data = await this.patientsService.search(q || '', labId, limitNum);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('patients.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.patientsService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('patients.create')
  async create(@Body() dto: CreatePatientDto, @CurrentLaboratory() labId: string) {
    const data = await this.patientsService.create(dto, labId);
    return ApiResponseDto.success(data, 'Patient créé');
  }

  @Patch(':id')
  @RequirePermissions('patients.update')
  async update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @CurrentLaboratory() labId: string) {
    const data = await this.patientsService.update(id, labId, dto);
    return ApiResponseDto.success(data, 'Patient mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('patients.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    await this.patientsService.remove(id, labId);
    return ApiResponseDto.success(null, 'Patient supprimé');
  }

  @Get(':id/contacts')
  @RequirePermissions('patients.read')
  async getContacts(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.patientsService.getContacts(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post(':id/contacts')
  @RequirePermissions('patients.contacts.manage')
  async createContact(@Param('id') id: string, @Body() dto: CreatePatientContactDto, @CurrentLaboratory() labId: string) {
    const data = await this.patientsService.createContact(id, labId, dto);
    return ApiResponseDto.success(data, 'Contact créé');
  }

  @Patch(':id/contacts/:contactId')
  @RequirePermissions('patients.contacts.manage')
  async updateContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdatePatientContactDto,
    @CurrentLaboratory() labId: string,
  ) {
    // id not strictly needed for service but kept for route clarity
    const data = await this.patientsService.updateContact(contactId, labId, dto);
    return ApiResponseDto.success(data, 'Contact mis à jour');
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions('patients.contacts.manage')
  async removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @CurrentLaboratory() labId: string,
  ) {
    await this.patientsService.removeContact(contactId, labId);
    return ApiResponseDto.success(null, 'Contact supprimé');
  }
}
