import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.guard';
import { ProfilesModule } from '../profiles/profiles.module';
import { getJwtModuleOptions } from '../config/app.config';

@Module({
  imports: [
    PrismaModule,

    JwtModule.register(getJwtModuleOptions()),

    ProfilesModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
