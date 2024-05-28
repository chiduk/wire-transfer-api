import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './validation/validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const API_PORT = configService.get('PORT');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          if (error.constraints)
            return Object.values(error.constraints).join(' ');
          return 'Validation Failed';
        });
        return new BadRequestException(messages);
      },
    }),
  );
  app.useGlobalFilters(new ValidationExceptionFilter());
  await app.listen(API_PORT);
}
bootstrap();
