import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service.js';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.update', 'patients.delete', 'patients.export',
    'analyses.view', 'analyses.create', 'analyses.update', 'analyses.delete', 'analyses.assign', 'analyses.export',
    'results.view', 'results.create', 'results.update', 'results.validate', 'results.review', 'results.export',
    'staff.view', 'staff.create', 'staff.update', 'staff.delete', 'staff.permissions', 'staff.export',
    'laboratory.view', 'laboratory.settings', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
    'billing.view', 'billing.create', 'billing.update', 'billing.delete', 'billing.reports',
    'reports.view', 'reports.generate', 'reports.export',
    'system.admin', 'system.users', 'system.backup', 'system.logs',
    // Backend-specific permission names
    'users.read', 'users.create', 'users.update', 'users.delete', 'users.roles.manage',
    'laboratory.read', 'laboratory.create', 'laboratory.update', 'laboratory.delete',
    'subscription.read', 'subscription.create', 'subscription.update', 'subscription.delete',
  ],
  admin: [
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.update', 'patients.delete', 'patients.export',
    'analyses.view', 'analyses.create', 'analyses.update', 'analyses.delete', 'analyses.assign', 'analyses.export',
    'results.view', 'results.create', 'results.update', 'results.validate', 'results.review', 'results.export',
    'staff.view', 'staff.create', 'staff.update', 'staff.delete', 'staff.permissions', 'staff.export',
    'laboratory.view', 'laboratory.settings', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
    'billing.view', 'billing.create', 'billing.update', 'billing.delete', 'billing.reports',
    'reports.view', 'reports.generate', 'reports.export',
    'system.users',
    // Backend-specific permission names
    'users.read', 'users.create', 'users.update', 'users.delete', 'users.roles.manage',
    'laboratory.read', 'laboratory.create', 'laboratory.update', 'laboratory.delete',
    'subscription.read', 'subscription.create', 'subscription.update', 'subscription.delete',
  ],
  doctor: [
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.update',
    'analyses.view', 'analyses.create', 'analyses.update',
    'results.view', 'results.create', 'results.update', 'results.validate', 'results.review',
    'reports.view', 'reports.generate',
    'laboratory.view',
    // Backend-specific
    'users.read',
    'laboratory.read',
    'subscription.read',
  ],
  technician: [
    'dashboard.view',
    'patients.view',
    'analyses.view', 'analyses.create', 'analyses.update', 'analyses.assign',
    'results.view', 'results.create', 'results.update', 'results.review',
    'laboratory.view', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
    // Backend-specific
    'laboratory.read',
    'subscription.read',
  ],
  receptionist: [
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.update',
    'analyses.view',
    'results.view',
    'staff.view',
    'laboratory.view',
    // Backend-specific
    'laboratory.read',
    'subscription.read',
  ],
  laborant: [
    'dashboard.view',
    'patients.view',
    'analyses.view', 'analyses.create', 'analyses.update',
    'results.view', 'results.create', 'results.update',
    'laboratory.view', 'laboratory.tests',
    // Backend-specific
    'laboratory.read',
    'subscription.read',
  ],
  viewer: [
    'dashboard.view',
    'patients.view',
    'analyses.view',
    'results.view',
    'staff.view',
    'laboratory.view',
    // Backend-specific
    'laboratory.read',
    'subscription.read',
  ],
  lab_manager: [
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.update', 'patients.export',
    'analyses.view', 'analyses.create', 'analyses.update', 'analyses.delete', 'analyses.assign', 'analyses.export',
    'results.view', 'results.create', 'results.update', 'results.validate', 'results.review', 'results.export',
    'staff.view', 'staff.create', 'staff.update', 'staff.permissions',
    'laboratory.view', 'laboratory.settings', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
    'billing.view',
    'reports.view', 'reports.generate', 'reports.export',
    // Backend-specific
    'users.read',
    'laboratory.read', 'laboratory.create', 'laboratory.update', 'laboratory.delete',
    'subscription.read', 'subscription.create', 'subscription.update', 'subscription.delete',
  ],
};

function expandRolesToPermissions(roles: string[]): string[] {
  const perms = new Set<string>();
  for (const role of roles) {
    const rp = ROLE_PERMISSIONS[role];
    if (rp) {
      for (const p of rp) {
        perms.add(p);
      }
    }
  }
  return Array.from(perms);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou invalide');
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.decodeToken(token);
      
      if (!payload || !payload.user_id) {
        throw new UnauthorizedException('Token invalide');
      }

      // Charger l'utilisateur avec ses rôles et permissions (colonnes directes)
      const user = await this.prisma.users.findUnique({
        where: { id: payload.user_id },
      });

      if (!user || !user.is_active || user.deleted_at) {
        throw new UnauthorizedException('Utilisateur non autorisé');
      }

      // Extraire les rôles depuis la colonne user.roles (TEXT[])
      const userRoles: string[] = user.roles || [];

      // Extraire les permissions directes depuis la colonne user.permissions (TEXT[])
      const directPermissions: string[] = user.permissions || [];

      // Élargir les rôles en permissions module.action
      const rolePermissions = expandRolesToPermissions(userRoles);

      // Fusionner : permissions directes + permissions issues des rôles
      const allPermissions = [...new Set([...directPermissions, ...rolePermissions])];

      request.user = {
        id: user.id,
        email: user.email,
        laboratory_id: user.laboratory_id,
        roles: userRoles,
        permissions: allPermissions,
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
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64').toString();
        const parsed = JSON.parse(payload);
        if (parsed.sub && !parsed.user_id) {
          parsed.user_id = parsed.sub;
        }
        return parsed;
      }
    } catch {
      // Ignorer les erreurs de décodage
    }
    return null;
  }
}
