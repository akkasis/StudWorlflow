import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.guard';
import { ModerationService } from '../moderation/moderation.service';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(
      new JwtAuthGuard(
        {} as JwtService,
        { isUserBanned: jest.fn() } as unknown as ModerationService,
      ),
    ).toBeDefined();
  });
});
