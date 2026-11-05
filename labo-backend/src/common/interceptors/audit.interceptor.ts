import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Enregistrer uniquement les opérations sensibles
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const laboratoryId = request.laboratory_id || user?.laboratory_id;
    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'];
    const path = request.route?.path || request.path;

    // Extraire entité et entity_id depuis le chemin
    const pathParts = path.split('/').filter(Boolean);
    const entity = pathParts[0] || 'unknown';
    const entityId = request.params?.id || request.params?.entity_id;

    let oldValues: any = null;
    let newValues: any = null;

    // Capturer les nouvelles valeurs depuis le body
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      newValues = request.body;
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Déterminer l'action
          let action = method.toLowerCase();
          if (method === 'DELETE') action = 'delete';
          else if (method === 'POST') action = 'create';
          else if (method === 'PUT' || method === 'PATCH') action = 'update';

          await this.prisma.audit_logs.create({
            data: {
              laboratory_id: laboratoryId || null,
              user_id: user?.id || null,
              action,
              entity,
              entity_id: entityId || response?.id || null,
              old_values: oldValues,
              new_values: newValues,
              ip_address: Array.isArray(ipAddress)
                ? ipAddress[0]
                : ipAddress || null,
            },
          });
        } catch (error) {
          // Ne pas faire échouer la requête si l'audit échoue
          console.error("Erreur lors de l'enregistrement de l'audit log:", error);
        }
      }),
    );
  }
}
