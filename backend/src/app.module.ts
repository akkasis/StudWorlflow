import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { ModerationModule } from './moderation/moderation.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ModerationModule,
    AuthModule,
    ProfilesModule,
    ReviewsModule,
    MessagesModule,
    SupportModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
