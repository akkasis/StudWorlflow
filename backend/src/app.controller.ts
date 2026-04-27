import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      name: 'skillent-api',
      status: 'ok',
      environment: appConfig.nodeEnv,
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
