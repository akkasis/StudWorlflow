import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SupportService } from './support.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('threads')
  async getThreads(@Req() req: any) {
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      return this.supportService.listThreads();
    }

    const me = await this.supportService.getThreadForUser(req.user.userId);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { profile: true },
    });

    return [
      {
        userId: String(req.user.userId),
        email: user?.email || '',
        name: user?.profile?.name || user?.email || 'Поддержка',
        lastMessage: me.messages[me.messages.length - 1]?.text || '',
        updatedAt:
          me.messages[me.messages.length - 1]?.createdAt ||
          new Date().toISOString(),
      },
    ];
  }

  @Get('thread')
  getMyThread(@Req() req: any) {
    return this.supportService.getThreadForUser(req.user.userId);
  }

  @Get('thread/:userId')
  getThread(@Req() req: any, @Param('userId') userId: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new ForbiddenException('Недостаточно прав');
    }
    return this.supportService.getThreadForUser(Number(userId));
  }

  @Post()
  sendUserMessage(@Req() req: any, @Body() body: { text: string }) {
    return this.supportService.sendUserMessage(req.user.userId, body.text);
  }

  @Post(':userId/reply')
  sendModeratorReply(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { text: string },
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new ForbiddenException('Недостаточно прав');
    }
    return this.supportService.sendModeratorReply(
      Number(userId),
      req.user.userId,
      body.text,
    );
  }
}
