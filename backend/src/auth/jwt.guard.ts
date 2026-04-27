import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ModerationService } from '../moderation/moderation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private moderationService: ModerationService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (await this.moderationService.isUserBanned(payload.userId)) {
        throw new UnauthorizedException('Account is banned');
      }

      request.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
