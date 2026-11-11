import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PasswordUtil } from '../common/utils/password.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createUserDto: any, laboratoryId?: string | null, _actorId?: string) {
    const targetLabId = createUserDto.laboratory_id ?? laboratoryId ?? null;
    const email = createUserDto.email;

    if (email) {
      const whereExist: any = { email, deleted_at: null };
      if (targetLabId) whereExist.laboratory_id = targetLabId;
      const exists = await this.prisma.users.count({ where: whereExist });
      if (exists > 0) throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const password_hash = createUserDto.password
      ? await PasswordUtil.hash(createUserDto.password)
      : null;

    const roles: string[] = Array.isArray(createUserDto.roles) && createUserDto.roles.length
      ? createUserDto.roles
      : ['viewer'];

    const user = await this.prisma.users.create({
      data: {
        laboratory_id: targetLabId,
        email: email || null,
        password_hash,
        first_name: createUserDto.first_name || '',
        last_name: createUserDto.last_name || '',
        phone: createUserDto.phone ?? null,
        avatar_url: createUserDto.avatar_url ?? null,
        roles,
        permissions: Array.isArray(createUserDto.permissions) ? createUserDto.permissions : [],
        is_active: createUserDto.is_active !== false,
      },
    });

    return this.findByIdAny(user.id);
  }

  async findAll(laboratoryId: string | undefined | null, pagination: PaginationDto) {
    const where: any = { deleted_at: null };
    if (laboratoryId) {
      where.laboratory_id = laboratoryId;
    }
    if ((pagination as any).search) {
      const s = (pagination as any).search;
      where.OR = [
        { first_name: { contains: s, mode: 'insensitive' } },
        { last_name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip: (pagination as any).skip ?? 0,
        take: (pagination as any).take ?? 50,
        orderBy: { [(pagination as any).sortBy || 'created_at']: (pagination as any).sortOrder || 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);
    return { items: items.map((u: any) => this.sanitize(u)), total };
  }

  async findById(id: string, laboratoryId: string) {
    const where: any = { id, deleted_at: null };
    if (laboratoryId) where.laboratory_id = laboratoryId;
    const user = await this.prisma.users.findFirst({ where });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitize(user);
  }

  async findByIdAny(id: string) {
    const user = await this.prisma.users.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitize(user);
  }

  async findByEmail(email: string, laboratoryId: string) {
    return this.prisma.users.findFirst({
      where: { email, laboratory_id: laboratoryId, deleted_at: null },
    });
  }

  async update(id: string, _laboratoryId: string | undefined | null, dto: any) {
    const existing = await this.prisma.users.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');

    const data: any = {};
    if (dto.first_name !== undefined) data.first_name = dto.first_name ?? '';
    if (dto.last_name !== undefined) data.last_name = dto.last_name ?? '';
    if (dto.phone !== undefined) data.phone = dto.phone ?? null;
    if (dto.email !== undefined) data.email = dto.email ?? null;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url ?? null;
    if (dto.laboratory_id !== undefined) data.laboratory_id = dto.laboratory_id || null;
    if (dto.roles !== undefined) data.roles = Array.isArray(dto.roles) ? dto.roles : existing.roles;
    if (dto.permissions !== undefined) data.permissions = Array.isArray(dto.permissions) ? dto.permissions : existing.permissions;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.prisma.users.update({ where: { id }, data });
    return this.sanitize(updated);
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.password_hash && currentPassword) {
      const ok = await PasswordUtil.verify(currentPassword, user.password_hash);
      if (!ok) throw new BadRequestException('Mot de passe actuel incorrect');
    }
    const hash = await PasswordUtil.hash(newPassword);
    await this.prisma.users.update({ where: { id }, data: { password_hash: hash } });
    return { success: true };
  }

  async remove(id: string, _laboratoryId?: string) {
    const existing = await this.prisma.users.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');
    await this.prisma.users.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
    return { success: true };
  }

  async activate(id: string, _laboratoryId?: string) {
    const existing = await this.prisma.users.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitize(await this.prisma.users.update({ where: { id }, data: { is_active: true } }));
  }

  async deactivate(id: string, _laboratoryId?: string) {
    const existing = await this.prisma.users.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitize(await this.prisma.users.update({ where: { id }, data: { is_active: false } }));
  }

  async assignRoles(userId: string, laboratoryId: string, roleIds: string[], actorId?: string) {
    const user = await this.prisma.users.findFirst({ where: { id: userId, deleted_at: null } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    try {
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
    } catch {}
    return this.getRoles(userId, laboratoryId);
  }

  async getRoles(userId: string, laboratoryId: string) {
    try {
      const rows = await this.prisma.user_roles.findMany({
        where: { user_id: userId, laboratory_id: laboratoryId },
        include: { role: true },
      });
      return rows.map((r: any) => r.role);
    } catch {
      return [];
    }
  }

  async getPermissions(_userId: string, _laboratoryId: string) {
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
