import { config as dotenvConfig } from 'dotenv';
import { join } from 'node:path';

export interface AlliyaConfig {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  supabase: SupabaseConfig;
  storage: StorageConfig;
}

export interface AppConfig {
  port: number;
  env: string;
  frontendUrl: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface StorageConfig {
  bucket: string;
}

export function loadEnvironment(): Record<string, string> {
  dotenvConfig({ path: join(process.cwd(), '.env') });
  return process.env as Record<string, string>;
}

export function createConfiguration(): AlliyaConfig {
  const env = loadEnvironment();
  return {
    app: {
      port: Number(env.PORT) || 3000,
      env: env.NODE_ENV || 'development',
      frontendUrl: env.FRONTEND_URL || 'http://localhost:3000',
    },
    database: {
      url: env.DATABASE_URL || '',
    },
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET || '',
      refreshSecret: env.JWT_REFRESH_SECRET || '',
      accessExpiresIn: Number(env.JWT_ACCESS_EXPIRES_IN) || 900,
      refreshExpiresIn: Number(env.JWT_REFRESH_EXPIRES_IN) || 604800,
    },
    supabase: {
      url: env.SUPABASE_URL || '',
      anonKey: env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    storage: {
      bucket: env.STORAGE_BUCKET || 'documents',
    },
  };
}
