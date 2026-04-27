import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileMetaService } from './profile-meta.service';

@Module({
  imports: [PrismaModule],
  providers: [ProfilesService, ProfileMetaService],
  controllers: [ProfilesController],
  exports: [ProfilesService, ProfileMetaService],
})
export class ProfilesModule {}
