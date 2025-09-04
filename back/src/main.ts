import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, Logger, ValidationPipe} from '@nestjs/common';
import {ValidationError} from 'class-validator';
import rateLimit from "express-rate-limit";
import { ControlConfigModule } from './config/control-config.module';
import { ControlConfigService } from './config/services/ControlConfigService';
import getPort, { portNumbers } from 'get-port';

async function bootstrap() {
    const logger = new Logger();

    // we instantiate the node config application to obtain the port
    const configModule = await NestFactory.createApplicationContext(ControlConfigModule);
    const configService = configModule.get(ControlConfigService);

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

    // we specify port to listen on
    const startingPort = configService.getSpecifiedPort();
    const endingPort = startingPort + 1000;
    const port = await getPort({
        port: portNumbers(startingPort, endingPort),
    })
    logger.log(`Listening at port ${port}`)

    // launch application
    await app.listen(port);
}

bootstrap();
