import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, Logger, ValidationPipe} from '@nestjs/common';
import {ValidationError} from 'class-validator';
import rateLimit from "express-rate-limit";

async function bootstrap() {
    const logger = new Logger();
    const app = await NestFactory.create(AppModule);
    const validationPipe = new ValidationPipe({
        exceptionFactory: (errors: ValidationError[]) => {
            return new BadRequestException(
                errors.map(err => ({
                    field: err.property,
                    errors: Object.values(err.constraints || {}),
                })),
            );
        },
    });

    // add a rate limit on the number of requests
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requêtes max par IP
        }),
    );


    app.useGlobalPipes(validationPipe);
    const port = process.env.PORT ?? 3000;
    logger.log(`Listening at port ${port}`)
    await app.listen(port);
}

bootstrap();
