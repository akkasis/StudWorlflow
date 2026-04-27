import { Global, Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
