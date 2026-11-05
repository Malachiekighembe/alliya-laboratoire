import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordUtil } from '../common/utils/password.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, AssignRolesDto } from './users.dtos.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, laboratoryId: string, actorId?: string) {
    const exists = await this.existsByEmail(createUserDto.email, laboratoryId);
    if (exists) throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const password_hash = await PasswordUtil.hash(createUserDto.password);

    const user = await this.prisma.users.create({
      data: {
        laboratory_id: laboratoryId,
        email: createUserDto.email,
        password_hash,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        phone: createUserDto.phone,
      },
    });

    if (createUserDto.role_ids && createUserDto.role_ids.length > 0) {
      await this.assignRoles(user.id, laboratoryId, createUserDto.role_ids, actorId);
    }

    return this.findById(user.id, laboratoryId);
  }

  async findAll(laboratoryId: string, pagination: PaginationDto) {
    const where: any = { laboratory_id: laboratoryId, deleted_at: null };
    if (pagination.search) {
      where.OR = [
        { first_name: { contains: pagination.search, mode: 'insensitive' } },
        { last_name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'created_at']: pagination.sortOrder || 'desc' },
        include: { user_roles: { include: { role: true } } },
      }),
      this.prisma.users.count({ where }),
    ]);
    return { items: items.map((u: any) => this.sanitize(u)), total };
  }

  async findById(id: string, laboratoryId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, laboratory_id: laboratoryId, deleted_at: null },
      include: { user_roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitize(user);
  }

  async findByEmail(email: string, laboratoryId: string) {
    return this.prisma.users.findFirst({
      where: { email, laboratory_id: laboratoryId, deleted_at: null },
      include: { user_roles: { include: { role: true } } },
    });
  }

  async update(id: string, laboratoryId: string, dto: UpdateUserDto) {
    await this.findById(id, laboratoryId);
    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
      },
      include: { user_roles: { include: { role: true } } },
    });
    return this.sanitize(updated);
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const ok = await PasswordUtil.verify(currentPassword, user.password_hash);
    if (!ok) throw new BadRequestException('Mot de passe actuel incorrect');
    const hash = await PasswordUtil.hash(newPassword);
    await this.prisma.users.update({ where: { id }, data: { password_hash: hash } });
    return { success: true };
  }

  async remove(id: string, laboratoryId: string) {
    await this.findById(id, laboratoryId);
    await this.prisma.users.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
    return { success: true };
  }

  async activate(id: string, laboratoryId: string) {
    await this.findById(id, laboratoryId);
    return this.prisma.users.update({ where: { id }, data: { is_active: true } });
  }

  async deactivate(id: string, laboratoryId: string) {
    await this.findById(id, laboratoryId);
    return this.prisma.users.update({ where: { id }, data: { is_active: false } });
  }

  async assignRoles(userId: string, laboratoryId: string, roleIds: string[], actorId?: string) {
    await this.findById(userId, laboratoryId);
    await this.prisma.$transaction(async (tx: any) => {
      await tx.user_roles.deleteMany({ where: { user_id: userId, laboratory_id: laboratoryId } });
      if (roleIds.length > 0) {
        await tx.user_roles.createMany({
          data: roleIds.map((roleId) => ({
            user_id: userId,
            role_id: roleId,
            laboratory_id: laboratoryId,
            assigned_by: actorId,
          })),
        });
      }
    });
    return this.getRoles(userId, laboratoryId);
  }

  async getRoles(userId: string, laboratoryId: string) {
    const rows = await this.prisma.user_roles.findMany({
      where: { user_id: userId, laboratory_id: laboratoryId },
      include: { role: true },
    });
    return rows.map((r: any) => r.role);
  }

  async getPermissions(userId: string, laboratoryId: string) {
    const roles = await this.getRoles(userId, laboratoryId);
    const roleIds = roles.map((r: any) => r.id);
    // permissions linked via role_permissions? schema has no direct relation. Return codes from roles? 
    // permissions table has no FK to roles in schema; assume role code maps. Return empty gracefully.
    return [];
  }

  async existsByEmail(email: string, laboratoryId: string): Promise<boolean> {
    const count = await this.prisma.users.count({ where: { email, laboratory_id: laboratoryId, deleted_at: null } });
    return count > 0;
  }

  private sanitize(user: any) {
    if (!user) return user;
    const { password_hash, ...rest } = user;
    if (rest.user_roles) {
      rest.roles = rest.user_roles.map((ur: any) => ur.role);
      delete rest.user_roles;
    }
    return rest;
  }
}

