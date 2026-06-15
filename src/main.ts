import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // 1. HTTP Security Headers with Helmet (configured to allow Swagger UI inline scripts and styles)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: false,                // Disable HSTS to prevent forcing HTTPS in local/private network testing
    }),
  );

  // 2. Enable CORS
  app.enableCors();

  // 3. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips any property not defined in the DTO
      forbidNonWhitelisted: true, // Throws error if unexpected properties are sent
      transform: true,            // Automatically converts primitive payloads to their DTO types
    }),
  );

  // 4. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Invoices & Products API')
    .setDescription('Backend API for managing products and API keys with secure combined authentication (JWT & API Keys).')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // 5. Start Server
  await app.listen(port);
  console.log(`[BOOTSTRAP] Invoices backend successfully running on port ${port}`);
  console.log(`[BOOTSTRAP] Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
