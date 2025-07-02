/**
 * NestJS Nurse Platform Backend
 * Production-ready backend with comprehensive API documentation
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Enable CORS
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: nodeEnv === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Setup Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Nurse Platform API')
      .setDescription('Comprehensive API for the Nurse Platform - connecting patients with qualified nurses')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication and profile management')
      .addTag('Nurses', 'Nurse-related operations and search')
      .addTag('Requests', 'Patient request management')
      .addTag('Admin', 'Administrative operations')
      .addServer(`http://localhost:${port}`, 'Development server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Nurse Platform API Documentation',
    });

    Logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error);
  process.exit(1);
});

