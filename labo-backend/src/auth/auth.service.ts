import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { PasswordUtil, UuidUtil } from '../common/index.js';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto } from './auth.dtos.js';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  laboratory_id: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  private async verifyPassword(plain: string, stored: string | null): Promise<boolean> {
    if (!stored) return false;
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      return PasswordUtil.verify(plain, stored);
    }
    return plain === stored;
  }

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.users.findFirst({
      where: { laboratory_id: dto.laboratory_id, email: dto.email, deleted_at: null },
    });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const password_hash = dto.password ? await PasswordUtil.hash(dto.password) : null;
    const user = await this.prisma.users.create({
      data: {
        laboratory_id: dto.laboratory_id,
        email: dto.email,
        password_hash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone ?? null,
      },
    });

    return this.buildProfile(user.id, user.laboratory_id);
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: UserProfile }> {
    const user = await this.prisma.users.findFirst({
      where: { email: dto.email, deleted_at: null, is_active: true },
    });
    if (!user || !(await this.verifyPassword(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const profile = await this.buildProfile(user.id, user.laboratory_id);
    const tokens = await this.generateTokens(user.id, user.laboratory_id, dto.device_id);
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
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (user.password_hash && !(await this.verifyPassword(dto.current_password, user.password_hash))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const hash = await PasswordUtil.hash(dto.new_password);
    await this.prisma.users.update({ where: { id: userId }, data: { password_hash: hash } });
    return { message: 'Mot de passe mis à jour' };
  }

  async getProfile(userId: string, laboratory_id: string): Promise<UserProfile> {
    return this.buildProfile(userId, laboratory_id);
  }

  private async generateTokens(userId: string, laboratory_id: string | null, device_id?: string): Promise<AuthTokens> {
    const payload = { sub: userId, laboratory_id };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = UuidUtil.generate();
    const expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + 604800);

    const now = new Date();
    await this.prisma.sessions.create({
      data: {
        id: UuidUtil.generate(),
        user_id: userId,
        laboratory_id,
        device_id,
        refresh_token,
        expires_at,
        created_at: now,
        updated_at: now,
      },
    });

    return {
      access_token,
      refresh_token,
      expires_in: 900,
    };
  }

  private async buildProfile(userId: string, laboratoryId: string | null): Promise<UserProfile> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      laboratory_id: laboratoryId ?? user.laboratory_id ?? null,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone ?? null,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
    };
  }
}
