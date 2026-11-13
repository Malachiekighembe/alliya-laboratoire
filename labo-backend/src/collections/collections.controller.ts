import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollectionsService } from './collections.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import {
  CreateCollectionDto,
  CreateSpecimensDto,
  SearchCollectionsDto,
  UpdateCollectionDto,
} from './collections.dtos.js';

@ApiTags('Collections (prélèvements)')
@ApiBearerAuth()
@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @RequirePermissions('specimens.read')
  async findAll(
    @CurrentLaboratory() laboratory_id: string,
    @Query() filters: SearchCollectionsDto,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.collectionsService.findAll(laboratory_id, page, limit, filters);
    return ApiResponseDto.success(data);
  }

  /** File d'attente des prélèvements (§7.1). */
  @Get('queue')
  @RequirePermissions('specimens.read')
  async queue(@CurrentLaboratory() laboratory_id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    const data = await this.collectionsService.findQueue(laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }

  @Get('patient/:patientId')
  @RequirePermissions('specimens.read')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentLaboratory() laboratory_id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.collectionsService.findByPatient(patientId, laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('specimens.read')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.collectionsService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('specimens.create')
  async create(
    @Body() dto: CreateCollectionDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.collectionsService.create(dto, laboratory_id, user_id);
    return ApiResponseDto.success(data, 'Prélèvement enregistré');
  }

  @Post(':id/specimens')
  @RequirePermissions('specimens.create')
  async createSpecimens(
    @Param('id') id: string,
    @Body() dto: CreateSpecimensDto,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser('id') user_id: string,
  ) {
    const data = await this.collectionsService.createSpecimens(id, laboratory_id, dto, user_id);
    return ApiResponseDto.success(data, 'Échantillons créés');
  }

  @Patch(':id/start')
  @RequirePermissions('specimens.create')
  async start(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.collectionsService.start(id, laboratory_id);
    return ApiResponseDto.success(data, 'Prélèvement démarré');
  }

  @Patch(':id/confirm')
  @RequirePermissions('specimens.create')
  async confirm(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.collectionsService.confirm(id, laboratory_id);
    return ApiResponseDto.success(data, 'Prélèvement effectué');
  }

  @Patch(':id/cancel')
  @RequirePermissions('specimens.create')
  async cancel(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @Body('reason') reason?: string,
  ) {
    const data = await this.collectionsService.cancel(id, laboratory_id, reason);
    return ApiResponseDto.success(data, 'Prélèvement annulé');
  }

  @Patch(':id')
  @RequirePermissions('specimens.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
    @CurrentLaboratory() laboratory_id: string,
  ) {
    const data = await this.collectionsService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Prélèvement mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('specimens.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    await this.collectionsService.update(id, laboratory_id, { status: 'annule' });
    return ApiResponseDto.success(null, 'Prélèvement annulé');
  }
}