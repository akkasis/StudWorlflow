import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });
  app.enableShutdownHooks();

  await app.listen(appConfig.port, appConfig.host);
}
bootstrap();
