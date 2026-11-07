import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { UsersService } from './users.service.js';
import { ForbiddenException } from '@nestjs/common';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, AssignRolesDto, ActivateUserDto, DeactivateUserDto } from './users.dtos.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  async findAll(@CurrentLaboratory() labId: string, @CurrentUser() user: any, @Query() pagination: PaginationDto) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const result = await this.usersService.findAll(isSuperAdmin ? undefined : labId, pagination);
    return new ApiResponseDto({ success: true, data: result.items, pagination: { page: pagination.page, limit: pagination.limit, total: result.total, totalPages: Math.ceil(result.total / pagination.limit), hasNext: pagination.page * pagination.limit < result.total, hasPrev: pagination.page > 1 } });
  }

  @Get(':id')
  @RequirePermissions('users.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    if (id !== user.id && !user.permissions?.includes('users.read')) {
      throw new ForbiddenException('Accès refusé');
    }
    const data = await this.usersService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('users.create')
  async create(@Body() dto: CreateUserDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const data = await this.usersService.create(dto, labId, user.id);
    return ApiResponseDto.success(data, 'Utilisateur créé');
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    if (id !== user.id) {
      // admin check via permission guard already
    }
    const data = await this.usersService.update(id, labId, dto);
    return ApiResponseDto.success(data, 'Utilisateur mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    await this.usersService.remove(id, labId);
    return ApiResponseDto.success(null, 'Utilisateur supprimé');
  }

  @Patch(':id/password')
  async updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto, @CurrentUser() user: any) {
    if (id !== user.id) throw new ForbiddenException('Accès refusé');
    await this.usersService.updatePassword(id, dto.current_password, dto.new_password);
    return ApiResponseDto.success(null, 'Mot de passe mis à jour');
  }

  @Post(':id/roles')
  @RequirePermissions('users.roles.manage')
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const data = await this.usersService.assignRoles(id, labId, dto.role_ids, user.id);
    return ApiResponseDto.success(data, 'Rôles assignés');
  }

  @Get(':id/roles')
  @RequirePermissions('users.read')
  async getRoles(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.usersService.getRoles(id, labId);
    return ApiResponseDto.success(data);
  }

  @Get(':id/permissions')
  @RequirePermissions('users.read')
  async getPermissions(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.usersService.getPermissions(id, labId);
    return ApiResponseDto.success(data);
  }

  @Patch(':id/activate')
  @RequirePermissions('users.update')
  async activate(@Param('id') id: string, @CurrentLaboratory() labId: string, @Body() _dto: ActivateUserDto) {
    const data = await this.usersService.activate(id, labId);
    return ApiResponseDto.success(data, 'Utilisateur activé');
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users.update')
  async deactivate(@Param('id') id: string, @CurrentLaboratory() labId: string, @Body() _dto: DeactivateUserDto) {
    const data = await this.usersService.deactivate(id, labId);
    return ApiResponseDto.success(data, 'Utilisateur désactivé');
  }
}
