import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class LaboratoryAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Accès non autorisé');
    }

    const roles: string[] = user.roles || [];
    const perms: string[] = user.permissions || [];
    const isSuperAdmin = roles.includes('super_admin') || perms.includes('system.admin');

    const bodyLaboratoryId = request.body?.laboratory_id;
    const paramLaboratoryId = request.params?.laboratory_id;
    const queryLaboratoryId = request.query?.laboratory_id;
    const requestedLaboratoryId = bodyLaboratoryId || paramLaboratoryId || queryLaboratoryId;

    if (isSuperAdmin) {
      // Super admin peut agir globalement ou cibler un laboratoire précis
      request.laboratory_id = requestedLaboratoryId || user.laboratory_id || null;
      return true;
    }

    if (!user.laboratory_id) {
      throw new ForbiddenException('Accès non autorisé');
    }

    if (requestedLaboratoryId && requestedLaboratoryId !== user.laboratory_id) {
      throw new ForbiddenException('Accès interdit à un autre laboratoire');
    }

    request.laboratory_id = user.laboratory_id;
    return true;
  }
}
