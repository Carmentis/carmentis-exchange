import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, Logger, ValidationPipe} from '@nestjs/common';
import {ValidationError} from 'class-validator';
import rateLimit from "express-rate-limit";

async function bootstrap() {
    const logger = new Logger();

    // create the app
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    // create the validation pipe
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
    app.useGlobalPipes(validationPipe);

    // add a rate limit on the number of requests
    /*
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requêtes max par IP
        }),
    );

     */



    const port = process.env.PORT ?? 3000;
    logger.log(`Listening at port ${port}`)
    await app.listen(port);
}

bootstrap();
