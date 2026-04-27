import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private moderationService: ModerationService,
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
      if (await this.moderationService.isUserBanned(payload.userId)) {
        throw new UnauthorizedException('Account is banned');
      }
      request.user = payload;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
