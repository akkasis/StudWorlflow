import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.guard';
import { ModerationService } from '../moderation/moderation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(
      new JwtAuthGuard(
        {} as JwtService,
        { isUserBanned: jest.fn() } as unknown as ModerationService,
        { user: { findUnique: jest.fn() } } as unknown as PrismaService,
      ),
    ).toBeDefined();
  });
});
