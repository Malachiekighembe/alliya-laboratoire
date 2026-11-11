import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service.js';
import { PasswordUtil } from '../common/utils/password.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createUserDto: any, laboratoryId?: string | null, _actorId?: string) {
    const targetLabId = createUserDto.laboratory_id ?? laboratoryId ?? null;
    const email = createUserDto.email ? String(createUserDto.email).trim().toLowerCase() : null;

    if (email) {
      const exists = await this.prisma.users.count({ where: { email, deleted_at: null } });
      if (exists > 0) throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const password_hash = createUserDto.password
      ? await PasswordUtil.hash(createUserDto.password)
      : null;

    const roles: string[] = Array.isArray(createUserDto.roles) && createUserDto.roles.length
      ? createUserDto.roles
      : ['viewer'];

    const matricule = createUserDto.matricule || `USR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const user = await this.prisma.users.create({
      data: {
        laboratory_id: targetLabId,
        email: email || null,
        password_hash,
        first_name: createUserDto.first_name || '',
        last_name: createUserDto.last_name || '',
        phone: createUserDto.phone ?? null,
        avatar_url: createUserDto.avatar_url ?? null,
        matricule,
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
    if (dto.email !== undefined) {
      const email = dto.email ? String(dto.email).trim().toLowerCase() : null;
      if (email && email !== existing.email) {
        const dup = await this.prisma.users.count({ where: { email, deleted_at: null, id: { not: id } } });
        if (dup > 0) throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
      data.email = email;
    }
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url ?? null;
    if (dto.matricule !== undefined) data.matricule = dto.matricule ?? null;
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

  private static emailOtps = new Map<string, { code: string; email: string; expiresAt: number }>();

  async requestEmailOtp(userId: string, newEmailRaw: string) {
    const email = String(newEmailRaw || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Adresse email invalide');
    }
    const existing = await this.prisma.users.findFirst({ where: { id: userId, deleted_at: null } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');
    if (existing.email && existing.email.toLowerCase() === email) {
      throw new BadRequestException('Cette adresse est déjà votre email actuel');
    }
    const dup = await this.prisma.users.count({ where: { email, deleted_at: null, id: { not: userId } } });
    if (dup > 0) throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    UsersService.emailOtps.set(userId, { code, email, expiresAt: Date.now() + 10 * 60 * 1000 });

    // Try to send via SMTP if configured (optional). Fallback: return devCode for environments without mail.
    let sent = false;
    try {
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM || user || 'no-reply@alliya-labo.app';
      if (host) {
        const nodemailer: any = await (Function('return import("nodemailer")')() as Promise<any>).catch(() => null);
        if (nodemailer) {
          const transporter = nodemailer.createTransport({ host, port: port || 587, secure: port === 465, auth: user && pass ? { user, pass } : undefined } as any);
          const subject = 'Code de vérification de votre adresse email — Alliya Laboratoire';
          const text = `Bonjour ${existing.first_name || ''},\n\nVotre code de vérification Alliya Laboratoire est : ${code}\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n— Alliya Laboratoire`;
          const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F5F8FA;font-family:Arial,Helvetica,sans-serif;color:#1E2A47;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="background:linear-gradient(135deg,#07122E,#1E2A47 55%,#3D9597);padding:28px 28px 22px;">
          <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">Alliya Laboratoire</div>
          <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.85);">Vérification de votre adresse email</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Bonjour <strong>${(existing.first_name || '').replace(/</g,'&lt;')}</strong>,</p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">Utilisez le code ci-dessous pour confirmer le changement de votre adresse email. Ce code est valable pendant <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:22px 0;">
            <div style="display:inline-block;background:#F0FAFA;border:1px solid #BFE7E8;border-radius:12px;padding:14px 22px;">
              <span style="font-size:30px;line-height:1;letter-spacing:8px;font-weight:700;color:#1E2A47;">${code}</span>
            </div>
          </div>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748B;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre adresse actuelle ne sera pas modifiée.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">Cet email a été envoyé automatiquement par Alliya Laboratoire. Merci de ne pas y répondre.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
          await transporter.sendMail({ from, to: email, subject, text, html });
          sent = true;
        }
      }
    } catch {
      sent = false;
    }

    return { email, sent, expiresIn: 600, ...(sent ? {} : { devCode: code }) };
  }

  async verifyEmailOtp(userId: string, newEmailRaw: string, codeRaw: string) {
    const email = String(newEmailRaw || '').trim().toLowerCase();
    const code = String(codeRaw || '').trim();
    if (!email || !code) throw new BadRequestException('Email et code requis');
    const entry = UsersService.emailOtps.get(userId);
    if (!entry || entry.email !== email) throw new BadRequestException('Aucune demande OTP valide pour cet email');
    if (Date.now() > entry.expiresAt) {
      UsersService.emailOtps.delete(userId);
      throw new BadRequestException('Code OTP expiré, veuillez en demander un nouveau');
    }
    if (entry.code !== code) throw new BadRequestException('Code OTP invalide');
    const dup = await this.prisma.users.count({ where: { email, deleted_at: null, id: { not: userId } } });
    if (dup > 0) throw new ConflictException('Un utilisateur avec cet email existe déjà');
    UsersService.emailOtps.delete(userId);
    const updated = await this.prisma.users.update({ where: { id: userId }, data: { email } });
    return this.sanitize(updated);
  }

  private getPublicProfileSecret() {
    return process.env.PUBLIC_PROFILE_SECRET || process.env.JWT_ACCESS_SECRET || 'alliya-public-profile-secret';
  }

  createPublicProfileToken(userId: string): string {
    const payload = Buffer.from(JSON.stringify({ uid: userId, t: 'p' })).toString('base64url');
    const sig = crypto.createHmac('sha256', this.getPublicProfileSecret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyPublicProfileToken(token: string): string | null {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [payload, sig] = parts;
      const expected = crypto.createHmac('sha256', this.getPublicProfileSecret()).update(payload).digest('base64url');
      const a = Buffer.from(sig); const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (!data?.uid || data.t !== 'p') return null;
      return String(data.uid);
    } catch { return null; }
  }

  async getPublicProfileTokenForUser(userId: string) {
    const existing = await this.prisma.users.findFirst({ where: { id: userId, deleted_at: null, is_active: true }, select: { id: true } });
    if (!existing) throw new NotFoundException('Utilisateur introuvable');
    return { token: this.createPublicProfileToken(userId) };
  }

  async findPublicByToken(token: string) {
    const userId = this.verifyPublicProfileToken(token);
    if (!userId) throw new NotFoundException('Profil introuvable');
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deleted_at: null, is_active: true },
      select: {
        first_name: true,
        last_name: true,
        avatar_url: true,
        matricule: true,
        roles: true,
        laboratory_id: true,
      },
    });
    if (!user) throw new NotFoundException('Profil introuvable');
    let laboratory: any = null;
    if (user.laboratory_id) {
      const lab = await this.prisma.laboratories.findFirst({
        where: { id: user.laboratory_id, deleted_at: null },
        select: { name: true, code: true, logo_url: true },
      }).catch(() => null);
      laboratory = lab || null;
    }
    return { ...user, laboratory };
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
