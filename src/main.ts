import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { EnvironmentVariables } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.enableVersioning({
    type: VersioningType.URI
  });

  const config = new DocumentBuilder()
    .setTitle('Campaign Reports API')
    .setDescription('API for managing campaign reports')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService<EnvironmentVariables>);
  const port = configService.get('port');
  
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap(); 