import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { UsersService } from './users.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, AssignRolesDto, ActivateUserDto, DeactivateUserDto } from './users.dtos.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: any) {
    const data = await this.usersService.findByIdAny(user.id);
    return ApiResponseDto.success(data);
  }

  @Patch('me')
  async updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    // self profile: only allow safe fields (email changes go through OTP)
    const safe = {
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
      avatar_url: dto.avatar_url,
    };
    const data = await this.usersService.update(user.id, null, safe);
    return ApiResponseDto.success(data, 'Profil mis à jour');
  }

  @Post('me/email/request-otp')
  async requestEmailOtp(@Body() body: { email?: string }, @CurrentUser() user: any) {
    const result = await this.usersService.requestEmailOtp(user.id, body?.email || '');
    return ApiResponseDto.success(result, 'Code OTP envoyé');
  }

  @Post('me/email/verify-otp')
  async verifyEmailOtp(@Body() body: { email?: string; code?: string }, @CurrentUser() user: any) {
    const data = await this.usersService.verifyEmailOtp(user.id, body?.email || '', body?.code || '');
    return ApiResponseDto.success(data, 'Adresse email mise à jour');
  }

  @Get()
  @RequirePermissions('users.read')
  async findAll(@CurrentLaboratory() labId: string, @CurrentUser() user: any, @Query() pagination: PaginationDto, @Query('laboratory_id') laboratory_id?: string) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const targetLab = isSuperAdmin ? (laboratory_id || undefined) : (labId || user.laboratory_id);
    const result = await this.usersService.findAll(targetLab, pagination);
    return new ApiResponseDto({ success: true, data: result.items, pagination: { page: (pagination as any).page, limit: (pagination as any).limit, total: result.total, totalPages: Math.ceil(result.total / (((pagination as any).limit) || 50 || 1)), hasNext: false, hasPrev: false } });
  }

  @Get(':id')
  @RequirePermissions('users.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    if (id !== user.id && !isSuperAdmin && !user.permissions?.includes('users.read')) {
      throw new ForbiddenException('Accès refusé');
    }
    const data = isSuperAdmin ? await this.usersService.findByIdAny(id) : await this.usersService.findById(id, labId || user.laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('users.create')
  async create(@Body() dto: CreateUserDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const targetLab = isSuperAdmin ? (dto.laboratory_id ?? null) : (labId || user.laboratory_id);
    const data = await this.usersService.create({ ...dto, laboratory_id: targetLab }, targetLab, user.id);
    return ApiResponseDto.success(data, 'Utilisateur créé');
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const data = await this.usersService.update(id, isSuperAdmin ? undefined : (labId || user.laboratory_id), dto);
    return ApiResponseDto.success(data, 'Utilisateur mis à jour');
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  async remove(@Param('id') id: string, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    await this.usersService.remove(id, isSuperAdmin ? undefined : (labId || user.laboratory_id));
    return ApiResponseDto.success(null, 'Utilisateur supprimé');
  }

  @Patch(':id/password')
  async updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto, @CurrentUser() user: any) {
    if (id !== user.id) throw new ForbiddenException('Accès refusé');
    await this.usersService.updatePassword(id, dto.current_password || '', dto.new_password);
    return ApiResponseDto.success(null, 'Mot de passe mis à jour');
  }

  @Post(':id/roles')
  @RequirePermissions('users.roles.manage')
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto, @CurrentLaboratory() labId: string, @CurrentUser() user: any) {
    const data = await this.usersService.assignRoles(id, labId || user.laboratory_id, dto.role_ids, user.id);
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
  async activate(@Param('id') id: string, @CurrentLaboratory() labId: string, @Body() _dto: ActivateUserDto, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const data = await this.usersService.activate(id, isSuperAdmin ? undefined : (labId || user.laboratory_id));
    return ApiResponseDto.success(data, 'Utilisateur activé');
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users.update')
  async deactivate(@Param('id') id: string, @CurrentLaboratory() labId: string, @Body() _dto: DeactivateUserDto, @CurrentUser() user: any) {
    const isSuperAdmin = !!user && (user.roles?.includes('super_admin') || user.permissions?.includes('system.admin'));
    const data = await this.usersService.deactivate(id, isSuperAdmin ? undefined : (labId || user.laboratory_id));
    return ApiResponseDto.success(data, 'Utilisateur désactivé');
  }
}
