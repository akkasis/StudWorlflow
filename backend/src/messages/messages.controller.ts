import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MessagesService } from './messages.service';

const MAX_MESSAGE_FILE_SIZE_BYTES = 100 * 1024 * 1024;

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  getConversations(@Req() req: any) {
    return this.messagesService.getConversations(req.user.userId);
  }

  @Sse('stream')
  stream(
    @Query('token') token: string,
  ): Observable<{
    data: {
      type:
        | 'connected'
        | 'heartbeat'
        | 'conversation.updated'
        | 'conversation.read';
      conversationId?: string;
      messageId?: string;
      at: string;
    };
  }> {
    const userId = this.messagesService.authenticateStreamToken(token);
    return this.messagesService.createStream(userId);
  }

  @Get(':profileId')
  @UseGuards(JwtAuthGuard)
  getConversation(@Req() req: any, @Param('profileId') profileId: string) {
    return this.messagesService.getConversation(
      req.user.userId,
      Number(profileId),
    );
  }

  @Post(':profileId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: MAX_MESSAGE_FILE_SIZE_BYTES,
      },
    }),
  )
  sendMessage(
    @Req() req: any,
    @Param('profileId') profileId: string,
    @UploadedFiles() files: any[],
    @Body()
    body: {
      text?: string;
      replyToMessageId?: string;
      voiceDurationSec?: string;
      isVoiceNote?: string;
    },
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      Number(profileId),
      {
        text: body.text,
        replyToMessageId: body.replyToMessageId,
        voiceDurationSec: body.voiceDurationSec
          ? Number(body.voiceDurationSec)
          : null,
        isVoiceNote: body.isVoiceNote,
      },
      files || [],
    );
  }

  @Patch('message/:messageId')
  @UseGuards(JwtAuthGuard)
  editMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { text: string },
  ) {
    return this.messagesService.editMessage(
      req.user.userId,
      messageId,
      body.text,
    );
  }

  @Post(':profileId/interest')
  @UseGuards(JwtAuthGuard)
  expressInterest(@Req() req: any, @Param('profileId') profileId: string) {
    return this.messagesService.expressInterest(
      req.user.userId,
      Number(profileId),
    );
  }
}
