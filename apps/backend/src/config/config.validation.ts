import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Database
  MONGODB_URI: Joi.string().required().description('MongoDB connection URI'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),

  // Server
  PORT: Joi.number().port().default(3001).description('Server port'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Node environment'),

  // CORS
  FRONTEND_URL: Joi.string().uri().required().description('Frontend URL for CORS'),

  // Email Configuration
  MAIL_HOST: Joi.string().required().description('SMTP host for email sending'),
  MAIL_USER: Joi.string().email().required().description('SMTP username/email'),
  MAIL_PASSWORD: Joi.string().required().description('SMTP password'),

  // Optional configurations
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('Logging level'),
});

export interface ConfigVariables {
  MONGODB_URI: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;
  MAIL_HOST: string;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}
