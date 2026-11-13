import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PatientDocumentsService } from './patient-documents.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import {
  CreatePatientDocumentDto,
  SearchPatientDocumentsDto,
} from './patient-documents.dtos.js';

@ApiTags('Documents patients')
@ApiBearerAuth()
@Controller('patient-documents')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class PatientDocumentsController {
  constructor(private readonly documentsService: PatientDocumentsService) {}

  @Get()
  @RequirePermissions('patients.read')
  async findAll(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchPatientDocumentsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.documentsService.findAll(laboratory_id, { ...filters, page: Number(page), limit: Number(limit) });
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('patients.read')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.documentsService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('patients.update')
  async create(
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePatientDocumentDto,
  ) {
    const data = await this.documentsService.create(laboratory_id, dto, userId);
    return ApiResponseDto.success(data, 'Document créé');
  }

  @Patch(':id/print')
  @RequirePermissions('patients.update')
  async markPrinted(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.documentsService.markPrinted(id, laboratory_id, userId);
    return ApiResponseDto.success(data, 'Marqué comme imprimé');
  }

  @Delete(':id')
  @RequirePermissions('patients.update')
  async remove(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.documentsService.remove(id, laboratory_id);
    return ApiResponseDto.success(data, 'Document supprimé');
  }
}