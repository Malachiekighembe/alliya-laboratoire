import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Erreur interne du serveur";
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      }
    } else {
      let detail: string;
      if (exception instanceof Error) {
        detail = `${exception.name}: ${exception.message}`;
      } else if (typeof exception === 'object' && exception !== null) {
        try {
          detail = JSON.stringify(exception);
        } catch {
          detail = String(exception);
        }
      } else {
        detail = String(exception);
      }
      this.logger.error(
        `Erreur non gérée: ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // Ne pas exposer les détails des erreurs internes
      message = "Erreur interne du serveur";
      error = 'Internal Server Error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
