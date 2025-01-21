import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  const validationPipe = new ValidationPipe({
    exceptionFactory: (errors: ValidationError[]) => {
      // Log detailed error information
      console.error('Validation errors:', errors);

      // Optionnel : transformer les erreurs en un format spécifique
      return new BadRequestException(
          errors.map(err => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          })),
      );
    },
  });

  app.useGlobalPipes(validationPipe);
  const port = process.env.PORT ?? 3000;
  logger.log(`Listening at port ${port}`)
  await app.listen(port);
}
bootstrap();
