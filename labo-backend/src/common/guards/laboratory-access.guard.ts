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

    if (!user || !user.laboratory_id) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Vérifier laboratory_id depuis le corps de requête ou les paramètres
    const bodyLaboratoryId = request.body?.laboratory_id;
    const paramLaboratoryId = request.params?.laboratory_id;
    const queryLaboratoryId = request.query?.laboratory_id;

    const requestedLaboratoryId =
      bodyLaboratoryId || paramLaboratoryId || queryLaboratoryId;

    // Si un laboratory_id est spécifié dans la requête, il doit correspondre à celui du token
    if (requestedLaboratoryId && requestedLaboratoryId !== user.laboratory_id) {
      throw new ForbiddenException(
        "Accès interdit à un autre laboratoire",
      );
    }

    // Attacher le laboratory_id du token à la requête
    request.laboratory_id = user.laboratory_id;
    
    return true;
  }
}
