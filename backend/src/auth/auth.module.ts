import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.guard';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    PrismaModule,

    // 🔥 ДЕЛАЕМ ГЛОБАЛЬНЫМ
    JwtModule.register({
      global: true,
      secret: 'super_secret_key',
      signOptions: { expiresIn: '7d' },
    }),

    ProfilesModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}