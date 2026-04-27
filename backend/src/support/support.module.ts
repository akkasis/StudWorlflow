import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: 'super_secret_key',
    }),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
