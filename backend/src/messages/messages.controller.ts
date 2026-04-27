import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.messagesService.getConversations(req.user.userId);
  }

  @Get(':profileId')
  getConversation(@Req() req: any, @Param('profileId') profileId: string) {
    return this.messagesService.getConversation(
      req.user.userId,
      Number(profileId),
    );
  }

  @Post(':profileId')
  sendMessage(
    @Req() req: any,
    @Param('profileId') profileId: string,
    @Body() body: { text: string },
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      Number(profileId),
      body.text,
    );
  }
}
