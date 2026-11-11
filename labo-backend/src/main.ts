import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  // Compression HTTP (réponses plus rapides) si disponible
  try {
    // @ts-ignore optional dependency (installer: npm i compression)
    const compression = (await import('compression')).default;
    app.use(compression());
  } catch {
    // compression non installé: continuer sans bloquer
  }

  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  // Désactiver l'en-tête x-powered-by (léger gain/sécurité)
  const http = app.getHttpAdapter().getInstance?.();
  if (http?.disable) http.disable('x-powered-by');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
