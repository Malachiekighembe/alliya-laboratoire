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
import { ConfigurationService } from './configuration.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import {
  CreateConfigurationItemDto,
  SearchConfigurationDto,
  SeedConfigurationDto,
  UpdateConfigurationItemDto,
} from './configuration.dtos.js';

@ApiTags('Configuration système')
@ApiBearerAuth()
@Controller('configuration')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  /** Catégories disponibles (pour construire les onglets d'administration). */
  @Get('categories')
  @RequirePermissions('laboratory.view')
  categories() {
    return ApiResponseDto.success(this.configurationService.categories);
  }

  /** Catalogue complet, regroupé par catégorie. */
  @Get('options')
  @RequirePermissions('laboratory.view')
  async options(@CurrentLaboratory() laboratory_id: string) {
    const data = await this.configurationService.options(laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get()
  @RequirePermissions('laboratory.view')
  async findAll(@CurrentLaboratory() laboratory_id: string, @Query() filters: SearchConfigurationDto) {
    const data = await this.configurationService.findAll(laboratory_id, filters);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('laboratory.view')
  async findById(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.configurationService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('laboratory.settings')
  async create(@CurrentLaboratory() laboratory_id: string, @Body() dto: CreateConfigurationItemDto) {
    const data = await this.configurationService.create(laboratory_id, dto);
    return ApiResponseDto.success(data, 'Item de configuration créé');
  }

  @Post('seed')
  @RequirePermissions('laboratory.settings')
  async seed(@CurrentLaboratory() laboratory_id: string, @Body() dto: SeedConfigurationDto) {
    const data = await this.configurationService.seed(laboratory_id, dto?.categories);
    return ApiResponseDto.success(data, 'Configuration initialisée');
  }

  @Patch(':id')
  @RequirePermissions('laboratory.settings')
  async update(
    @Param('id') id: string,
    @CurrentLaboratory() laboratory_id: string,
    @Body() dto: UpdateConfigurationItemDto,
  ) {
    const data = await this.configurationService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, 'Item de configuration mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('laboratory.settings')
  async remove(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.configurationService.remove(id, laboratory_id);
    return ApiResponseDto.success(data, 'Item de configuration désactivé');
  }
}