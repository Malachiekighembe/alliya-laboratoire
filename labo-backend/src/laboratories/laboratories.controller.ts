import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { LaboratoriesService } from './laboratories.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@ApiTags('Laboratories')
@ApiBearerAuth()
@Controller('laboratories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LaboratoriesController {
  constructor(private readonly service: LaboratoriesService) {}

  @Get()
  @RequirePermissions('laboratory.view')
  async findAll(@CurrentUser() user: any) {
    const data = await this.service.findAll(user);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('laboratory.view')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.service.findById(id, user);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('laboratory.settings')
  async create(@Body() dto: any, @CurrentUser() user: any) {
    const data = await this.service.create(dto, user);
    return ApiResponseDto.success(data, 'Laboratoire créé');
  }

  @Patch(':id')
  @RequirePermissions('laboratory.settings')
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    const data = await this.service.update(id, dto, user);
    return ApiResponseDto.success(data, 'Laboratoire mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('laboratory.settings')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.remove(id, user);
    return ApiResponseDto.success(null, 'Laboratoire supprimé');
  }
}
