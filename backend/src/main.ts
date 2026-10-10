import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-correlation-id',
      'X-Correlation-ID',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LLM Cost & Routing Autopilot API')
    .setDescription(
      'Control LLM spend without losing sight of quality, latency, or reliability. Production-grade cost analytics and intelligent routing system.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 LLM Cost & Routing Autopilot API running on: http://0.0.0.0:${port}/api/v1`,
  );
  logger.log(`📚 Swagger documentation at: http://0.0.0.0:${port}/api/docs`);
  logger.log(`🩺 Health check available at: http://0.0.0.0:${port}/health`);
}
bootstrap();
