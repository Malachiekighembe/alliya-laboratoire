import * as Joi from 'joi';

export interface EnvValidationResult {
  error?: Joi.ValidationError;
  value: Record<string, unknown>;
}

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  DATABASE_URL: Joi.string().required().messages({
    'any.required':
      'DATABASE_URL est requise (chaine de connexion Supabase PostgreSQL)',
    'string.empty': 'DATABASE_URL ne peut pas etre vide',
  }),

  JWT_ACCESS_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_ACCESS_SECRET est requis',
    'string.min': 'JWT_ACCESS_SECRET doit faire au moins 32 caracteres',
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_REFRESH_SECRET est requis',
    'string.min': 'JWT_REFRESH_SECRET doit faire au moins 32 caracteres',
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.number().positive().default(900),
  JWT_REFRESH_EXPIRES_IN: Joi.number().positive().default(604800),

  SUPABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'SUPABASE_URL est requise',
  }),
  SUPABASE_ANON_KEY: Joi.string().required().messages({
    'any.required': 'SUPABASE_ANON_KEY est requise',
  }),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required().messages({
    'any.required': 'SUPABASE_SERVICE_ROLE_KEY est requise',
  }),

  STORAGE_BUCKET: Joi.string().default('documents'),

  RATE_LIMIT_TTL: Joi.number().positive().default(60000),
  RATE_LIMIT_MAX: Joi.number().positive().default(100),
}).unknown(true);

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvValidationResult {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join('; ');
    throw new Error('Configuration invalide : ' + messages);
  }

  return { value };
}
