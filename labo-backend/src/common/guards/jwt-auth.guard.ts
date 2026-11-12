import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service.js';

const LAB_READ = [
  'patients.read', 'patients.view',
  'visits.read',
  'specimens.read',
  'examinations.read',
  'results.read',
  'result-validations.read',
  'orders.read',
  'billing.read',
  'users.read',
  'laboratory.view', 'laboratory.read',
  'subscription.read',
  'dashboard.view',
  'reports.view',
];

const LAB_OPERATE = [
  ...LAB_READ,
  'patients.create', 'patients.update', 'patients.delete', 'patients.contacts.manage', 'patients.export',
  'visits.create', 'visits.update', 'visits.delete', 'visits.cancel', 'visits.complete', 'visits.statistics', 'visits.orders.manage',
  'specimens.create', 'specimens.update', 'specimens.delete', 'specimens.status.manage', 'specimens.reject', 'specimens.discard',
  'examinations.create', 'examinations.update', 'examinations.delete', 'examinations.statistics',
  'results.create', 'results.update', 'results.validate', 'results.review', 'results.amend', 'results.cancel', 'results.statistics', 'results.export',
  'result-validations.create', 'result-validations.update', 'result-validations.delete',
  'orders.create', 'orders.update', 'orders.delete',
  'billing.create', 'billing.update', 'billing.delete', 'billing.issue', 'billing.pay', 'billing.payments.manage', 'billing.statistics', 'billing.reports',
  'users.create', 'users.update',
  'staff.view', 'staff.create', 'staff.update', 'staff.delete', 'staff.permissions', 'staff.export',
  'analyses.view', 'analyses.create', 'analyses.update', 'analyses.delete', 'analyses.assign', 'analyses.export',
  'laboratory.settings', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
  'reports.generate', 'reports.export',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    ...LAB_OPERATE,
    'users.delete', 'users.roles.manage',
    'laboratory.create', 'laboratory.update', 'laboratory.delete',
    'subscription.create', 'subscription.update', 'subscription.delete',
    'system.admin', 'system.users', 'system.backup', 'system.logs',
  ],
  admin: [
    ...LAB_OPERATE,
    'users.delete',
    'laboratory.create', 'laboratory.update', 'laboratory.delete',
    'subscription.create', 'subscription.update', 'subscription.delete',
    'system.users',
  ],
  lab_manager: [
    ...LAB_OPERATE,
    'users.delete',
  ],
  doctor: [
    'dashboard.view',
    'patients.read', 'patients.view', 'patients.create', 'patients.update',
    'visits.read', 'visits.create', 'visits.update',
    'specimens.read',
    'examinations.read',
    'results.read', 'results.create', 'results.update', 'results.validate', 'results.review',
    'result-validations.read', 'result-validations.create',
    'orders.read',
    'billing.read',
    'users.read',
    'laboratory.view', 'laboratory.read',
    'subscription.read',
    'reports.view',
    'analyses.view', 'analyses.create', 'analyses.update',
  ],
  technician: [
    'dashboard.view',
    'patients.read', 'patients.view',
    'visits.read',
    'specimens.read', 'specimens.create', 'specimens.update',
    'examinations.read', 'examinations.create', 'examinations.update',
    'results.read', 'results.create', 'results.update', 'results.review',
    'orders.read',
    'laboratory.view', 'laboratory.read', 'laboratory.tests', 'laboratory.equipment', 'laboratory.inventory',
    'subscription.read',
    'analyses.view', 'analyses.create', 'analyses.update',
  ],
  receptionist: [
    'dashboard.view',
    'patients.read', 'patients.view', 'patients.create', 'patients.update',
    'visits.read', 'visits.create', 'visits.update', 'visits.cancel', 'visits.complete',
    'specimens.read',
    'examinations.read',
    'results.read',
    'orders.read',
    'billing.read', 'billing.create', 'billing.pay',
    'users.read',
    'staff.view',
    'laboratory.view', 'laboratory.read',
    'subscription.read',
    'reports.view',
  ],
  laborant: [
    'dashboard.view',
    'patients.read', 'patients.view',
    'visits.read',
    'specimens.read', 'specimens.create', 'specimens.update', 'specimens.status.manage',
    'examinations.read', 'examinations.create', 'examinations.update',
    'results.read', 'results.create', 'results.update',
    'orders.read',
    'laboratory.view', 'laboratory.read', 'laboratory.tests',
    'subscription.read',
    'analyses.view', 'analyses.create', 'analyses.update',
  ],
  viewer: [
    'dashboard.view',
    'patients.read', 'patients.view',
    'visits.read',
    'specimens.read',
    'examinations.read',
    'results.read',
    'result-validations.read',
    'orders.read',
    'billing.read',
    'users.read',
    'staff.view',
    'laboratory.view', 'laboratory.read',
    'subscription.read',
    'reports.view',
    'analyses.view',
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
