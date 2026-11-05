import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordUtil, MetricUtil, UuidUtil } from '../common/index.js';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto } from './auth.dtos.js';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  laboratory_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
    private readonly metricUtil: MetricUtil,
    private readonly uuidUtil: UuidUtil,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.users.findFirst({
      where: { laboratory_id: dto.laboratory_id, email: dto.email, deleted_at: null },
    });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const password_hash = await PasswordUtil.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.users.create({
        data: {
          laboratory_id: dto.laboratory_id,
          email: dto.email,
          password_hash,
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone ?? null,
        },
      });

      if (dto.role_ids?.length) {
        await tx.user_roles.createMany({
          data: dto.role_ids.map((role_id) => ({
            user_id: created.id,
            role_id,
            laboratory_id: dto.laboratory_id,
            assigned_by: dto.assigned_by ?? created.id,
          })),
        });
      }

      return created;
    });

    return this.buildProfile(user.id, dto.laboratory_id);
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: UserProfile }> {
    const user = await this.prisma.users.findFirst({
      where: { laboratory_id: dto.laboratory_id, email: dto.email, deleted_at: null, is_active: true },
    });
    if (!user || !(await PasswordUtil.verify(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const profile = await this.buildProfile(user.id, dto.laboratory_id);
    const tokens = await this.generateTokens(user.id, dto.laboratory_id, dto.device_id);
    return { ...tokens, user: profile };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const session = await this.prisma.sessions.findUnique({
      where: { refresh_token: dto.refresh_token },
      include: { user: true },
    });
    if (!session || session.is_revoked || session.expires_at < new Date()) {
      throw new UnauthorizedException('Session expirée ou révoquée');
    }
    await this.prisma.sessions.update({
      where: { id: session.id },
      data: { is_revoked: true },
    });
    return this.generateTokens(session.user.id, session.laboratory_id, dto.device_id);
  }

  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      await this.prisma.sessions.updateMany({
        where: { user_id: userId, refresh_token: refreshToken },
        data: { is_revoked: true },
      });
    } else {
      await this.prisma.sessions.updateMany({
        where: { user_id: userId, is_revoked: false },
        data: { is_revoked: true },
      });
    }
    return { message: 'Déconnecté' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user || !(await PasswordUtil.verify(dto.current_password, user.password_hash))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const hash = await PasswordUtil.hash(dto.new_password);
    await this.prisma.users.update({ where: { id: userId }, data: { password_hash: hash } });
    return { message: 'Mot de passe mis à jour' };
  }

  async getProfile(userId: string, laboratory_id: string): Promise<UserProfile> {
    return this.buildProfile(userId, laboratory_id);
  }

  private async generateTokens(userId: string, laboratory_id: string, device_id?: string): Promise<AuthTokens> {
    const payload = { sub: userId, laboratory_id };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = UuidUtil.generate();
    const expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + 604800); // 7 days

    await this.prisma.sessions.create({
      data: {
        user_id: userId,
        laboratory_id,
        device_id,
        refresh_token,
        expires_at,
      },
    });

    return {
      access_token,
      refresh_token,
      expires_in: 900,
    };
  }

  private async buildProfile(userId: string, laboratory_id: string): Promise<UserProfile> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          where: { laboratory_id },
          include: { role: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException();

    const roles = user.user_roles.map((ur: any) => ur.role.code);
    const permissions = await this.getPermissions(userId, laboratory_id);

    return {
      id: user.id,
      laboratory_id: user.laboratory_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      roles,
      permissions,
    };
  }

  private async getPermissions(userId: string, laboratory_id: string): Promise<string[]> {
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: userId, laboratory_id },
      include: { role: { include: { permissions: true } } },
    });
    const perms = new Set<string>();
    for (const ur of roles) {
      for (const rp of ur.role.permissions) {
        perms.add(`${rp.module}.${rp.action}`);
      }
    }
    return Array.from(perms);
  }
}