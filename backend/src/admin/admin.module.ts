import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    PrismaModule,
    ProfilesModule,
    JwtModule.register({
      secret: 'super_secret_key',
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
