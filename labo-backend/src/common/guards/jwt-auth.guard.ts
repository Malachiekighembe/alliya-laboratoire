import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou invalide');
    }

    const token = authHeader.substring(7);
    
    // En environnement réel, valider le token Supabase ou JWT
    // Pour ce noyau commun, on extrait les claims si présents
    try {
      // Tentative d'extraction basique pour le développement
      // À remplacer par validation Supabase/JWT en production
      const payload = this.decodeToken(token);
      
      if (!payload || !payload.user_id) {
        throw new UnauthorizedException('Token invalide');
      }

      // Charger l'utilisateur avec ses rôles et permissions
      const user = await this.prisma.users.findUnique({
        where: { id: payload.user_id },
        include: {
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.is_active || user.deleted_at) {
        throw new UnauthorizedException('Utilisateur non autorisé');
      }

      // Extraire les permissions depuis les rôles
      // Note: Selon le schéma, les permissions ne sont pas liées directement aux rôles
      // mais stockées séparément; on les prend depuis le token ou les charge
      const permissions: string[] = payload.permissions || [];

      request.user = {
        id: user.id,
        email: user.email,
        laboratory_id: user.laboratory_id,
        roles: user.user_roles.map((ur: any) => ur.role.code),
        permissions,
      };
      request.laboratory_id = user.laboratory_id;
      request.user_id = user.id;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token invalide');
    }
  }

  private decodeToken(token: string): any {
    // Décodage basique sans vérification pour le noyau commun
    // À remplacer par validation appropriée
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64').toString();
        return JSON.parse(payload);
      }
    } catch {
      // Ignorer les erreurs de décodage
    }
    return null;
  }
}
