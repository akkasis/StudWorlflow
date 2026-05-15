import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Observable, Subject, interval, map, merge, of } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const MESSAGE_MAX_LENGTH = 2000;
const VOICE_MESSAGE_MAX_DURATION_SEC = 5 * 60;
const MAX_ATTACHMENTS_PER_MESSAGE = 10;

type UploadableFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type StreamPayload = {
  type: 'connected' | 'heartbeat' | 'conversation.updated' | 'conversation.read';
  conversationId?: string;
  messageId?: string;
  at: string;
};

type MessageRecord = any;

@Injectable()
export class MessagesService {
  private readonly streams = new Map<number, Set<Subject<StreamPayload>>>();
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
  ) {
    this.db = this.prisma as any;
  }

  async getConversations(userId: number) {
    const myProfile = await this.getRequiredProfile(userId);

    const conversations = await this.db.conversation.findMany({
      where: {
        OR: [
          { participantOneProfileId: myProfile.id },
          { participantTwoProfileId: myProfile.id },
        ],
      },
      include: {
        participantOne: {
          include: {
            user: {
              select: {
                role: true,
              },
            },
          },
        },
        participantTwo: {
          include: {
            user: {
              select: {
                role: true,
              },
            },
          },
        },
        messages: {
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const partnerUserIds = conversations.map((conversation) =>
      conversation.participantOneProfileId === myProfile.id
        ? conversation.participantTwo.userId
        : conversation.participantOne.userId,
    );
    const onlineUserIds = await this.getOnlineUserIds(partnerUserIds);

    return conversations.map((conversation) => {
      const isParticipantOne = conversation.participantOneProfileId === myProfile.id;
      const partnerProfile = isParticipantOne
        ? conversation.participantTwo
        : conversation.participantOne;
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const unreadCount = conversation.messages.filter((message) =>
        message.senderUserId !== userId &&
        (isParticipantOne
          ? !message.readByParticipantOne
          : !message.readByParticipantTwo),
      ).length;

      return {
        id: conversation.id,
        profileId: String(partnerProfile.id),
        name: partnerProfile.name,
        avatar: partnerProfile.avatarUrl,
        role:
          partnerProfile.user.role === 'tutor'
            ? 'tutor'
            : partnerProfile.role,
        university: partnerProfile.university,
        isOnline: onlineUserIds.has(partnerProfile.userId),
        lastMessage: this.getMessagePreview(lastMessage),
        lastMessageKind: lastMessage?.kind || 'text',
        timestamp: (lastMessage?.createdAt || conversation.updatedAt).toISOString(),
        lastSenderUserId: lastMessage?.senderUserId || null,
        unreadCount,
        hasInterest: conversation.messages.some((message) =>
          message.text.startsWith('Отклик на анкету'),
        ),
      };
    });
  }

  async getConversation(userId: number, profileId: number) {
    const { myProfile, targetProfile, conversation } =
      await this.prepareConversationContext(userId, profileId);

    if (conversation) {
      await this.markConversationAsRead(conversation.id, myProfile.id, userId);
    }

    const freshMessages = conversation
      ? await this.db.message.findMany({
          where: {
            conversationId: conversation.id,
          },
          include: {
            attachments: true,
            replyTo: {
              include: {
                attachments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      : [];
    const isOnline = await this.isUserIdOnline(targetProfile.userId);

    return {
      conversationId: conversation?.id || null,
      participant: {
        profileId: String(targetProfile.id),
        name: targetProfile.name,
        avatar: targetProfile.avatarUrl,
        role:
          targetProfile.user.role === 'tutor'
            ? 'tutor'
            : targetProfile.role,
        university: targetProfile.university,
        isOnline,
      },
      messages: freshMessages.map((message) =>
        this.serializeMessage(message, myProfile.id, userId),
      ),
    };
  }

  async sendMessage(
    userId: number,
    profileId: number,
    payload: {
      text?: string;
      replyToMessageId?: string;
      voiceDurationSec?: number | string | null;
      isVoiceNote?: unknown;
    },
    files: UploadableFile[] = [],
  ) {
    if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      throw new BadRequestException(
        `Можно прикрепить не больше ${MAX_ATTACHMENTS_PER_MESSAGE} файлов`,
      );
    }

    const normalizedText = this.normalizeOptionalText(payload.text);
    const normalizedVoiceDuration = this.normalizeVoiceDuration(
      payload.voiceDurationSec,
    );
    const isVoiceNote = this.normalizeBoolean(payload.isVoiceNote);

    if (!normalizedText && files.length === 0) {
      throw new BadRequestException(
        'Сообщение должно содержать текст или вложение',
      );
    }

    if (isVoiceNote && files.length !== 1) {
      throw new BadRequestException(
        'Голосовое сообщение должно содержать ровно один аудиофайл',
      );
    }

    const { myProfile, targetProfile, conversation, conversationId } =
      await this.prepareConversationContext(userId, profileId);
    const isSenderParticipantOne =
      conversation?.participantOneProfileId === myProfile.id ||
      (conversation
        ? false
        : this.sortProfilePair(myProfile.id, targetProfile.id)[0] === myProfile.id);

    const replyTarget = payload.replyToMessageId
      ? await this.db.message.findUnique({
          where: {
            id: payload.replyToMessageId,
          },
          include: {
            attachments: true,
          },
        })
      : null;

    if (payload.replyToMessageId && !replyTarget) {
      throw new NotFoundException('Сообщение для ответа не найдено');
    }

    if (replyTarget && replyTarget.conversationId !== conversationId) {
      throw new BadRequestException(
        'Нельзя отвечать на сообщение из другого диалога',
      );
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const uploaded = await this.storageService.uploadMessageFile(file, userId);
        return {
          kind: this.getAttachmentKind(uploaded.mimeType, isVoiceNote),
          url: uploaded.url,
          key: uploaded.key,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
          durationSec:
            this.getAttachmentKind(uploaded.mimeType, isVoiceNote) === 'voice'
              ? normalizedVoiceDuration
              : null,
        };
      }),
    );

    const kind = this.resolveMessageKind({
      hasText: Boolean(normalizedText),
      hasFiles: uploadedFiles.length > 0,
      isVoiceNote,
    });

    const message = await this.db.message.create({
      data: {
        id: randomUUID(),
        conversationId,
        senderUserId: userId,
        text: normalizedText || '',
        kind,
        readByParticipantOne: isSenderParticipantOne,
        readByParticipantTwo: !isSenderParticipantOne,
        readByParticipantOneAt: isSenderParticipantOne ? new Date() : null,
        readByParticipantTwoAt: !isSenderParticipantOne ? new Date() : null,
        replyToMessageId: replyTarget?.id || null,
        attachments: {
          create: uploadedFiles.map((file) => ({
            id: randomUUID(),
            kind: file.kind,
            url: file.url,
            key: file.key,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            durationSec: file.durationSec,
          })),
        },
      },
      include: {
        attachments: true,
        replyTo: {
          include: {
            attachments: true,
          },
        },
      },
    });

    await this.db.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: message.createdAt,
      },
    });

    this.emitConversationUpdate(conversationId, [
      myProfile.userId,
      targetProfile.userId,
    ], message.id);

    return this.serializeMessage(message, myProfile.id, userId);
  }

  async editMessage(userId: number, messageId: string, text: string) {
    const normalizedText = this.normalizeRequiredText(text);
    const existingMessage = await this.db.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        conversation: true,
        attachments: true,
        replyTo: {
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!existingMessage) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (existingMessage.senderUserId !== userId) {
      throw new BadRequestException('Можно редактировать только свои сообщения');
    }

    const updatedMessage = await this.db.message.update({
      where: {
        id: messageId,
      },
      data: {
        text: normalizedText,
        editedAt: new Date(),
      },
      include: {
        attachments: true,
        replyTo: {
          include: {
            attachments: true,
          },
        },
        conversation: true,
      },
    });

    const myProfile = await this.getRequiredProfile(userId);
    const targetUserId = await this.getOtherParticipantUserId(
      updatedMessage.conversation,
      myProfile.id,
    );

    this.emitConversationUpdate(updatedMessage.conversationId, [
      userId,
      targetUserId,
    ], updatedMessage.id);

    return this.serializeMessage(updatedMessage, myProfile.id, userId);
  }

  async expressInterest(userId: number, profileId: number) {
    const { conversationId, targetProfile } =
      await this.prepareConversationContext(userId, profileId);

    const existingCount = await this.db.message.count({
      where: {
        conversationId,
      },
    });

    if (existingCount === 0) {
      await this.sendMessage(userId, profileId, {
        text: `Отклик на анкету ${targetProfile.name}: хочу обсудить занятие и детали сотрудничества.`,
      });
    }

    return {
      success: true,
      conversationId,
      created: existingCount === 0,
    };
  }

  authenticateStreamToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException('No token');
    }

    try {
      const payload = this.jwtService.verify(token);
      return Number(payload.userId);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  createStream(userId: number): Observable<{ data: StreamPayload }> {
    const subject = new Subject<StreamPayload>();
    const current = this.streams.get(userId) || new Set<Subject<StreamPayload>>();
    current.add(subject);
    this.streams.set(userId, current);

    return new Observable<{ data: StreamPayload }>((subscriber) => {
      const subscription = merge(
        of<StreamPayload>({
          type: 'connected',
          at: new Date().toISOString(),
        }),
        interval(20000).pipe(
          map(
            () =>
              ({
                type: 'heartbeat',
                at: new Date().toISOString(),
              }) satisfies StreamPayload,
          ),
        ),
        subject,
      ).subscribe({
        next: (value) => subscriber.next({ data: value }),
        error: (error) => subscriber.error(error),
      });

      return () => {
        subscription.unsubscribe();
        const nextSet = this.streams.get(userId);
        if (!nextSet) {
          return;
        }
        nextSet.delete(subject);
        if (nextSet.size === 0) {
          this.streams.delete(userId);
        }
      };
    });
  }

  private async prepareConversationContext(userId: number, profileId: number) {
    const [myProfile, targetProfile] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      }),
      this.prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      }),
    ]);

    if (!myProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (!targetProfile) {
      throw new NotFoundException('Recipient profile not found');
    }

    if (myProfile.userId === targetProfile.userId) {
      throw new BadRequestException('You cannot message yourself');
    }

    if (myProfile.user.role !== 'tutor' && targetProfile.user.role !== 'tutor') {
      throw new BadRequestException(
        'Messages are only available between students and tutors',
      );
    }

    const [participantOneProfileId, participantTwoProfileId] =
      this.sortProfilePair(myProfile.id, targetProfile.id);
    const conversationId = `conversation_${participantOneProfileId}_${participantTwoProfileId}`;

    await this.db.conversation.upsert({
      where: {
        participantOneProfileId_participantTwoProfileId: {
          participantOneProfileId,
          participantTwoProfileId,
        },
      },
      create: {
        id: conversationId,
        participantOneProfileId,
        participantTwoProfileId,
      },
      update: {},
    });

    const conversation = await this.db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participantOne: true,
        participantTwo: true,
      },
    });

    return {
      myProfile,
      targetProfile,
      conversation,
      conversationId,
    };
  }

  private serializeMessage(
    message: MessageRecord,
    myProfileId: number,
    currentUserId: number,
  ) {
    const isParticipantOne = message.conversationId.startsWith(
      `conversation_${myProfileId}_`,
    );
    const isOwnMessage = message.senderUserId === currentUserId;

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      kind: message.kind,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() || null,
      isEdited: Boolean(message.editedAt),
      status: isOwnMessage
        ? isParticipantOne
          ? message.readByParticipantTwo
            ? 'read'
            : 'delivered'
          : message.readByParticipantOne
            ? 'read'
            : 'delivered'
        : null,
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        url: attachment.url,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        durationSec: attachment.durationSec,
      })),
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            senderUserId: message.replyTo.senderUserId,
            text: message.replyTo.text,
            kind: message.replyTo.kind,
            attachments: message.replyTo.attachments.map((attachment) => ({
              id: attachment.id,
              kind: attachment.kind,
              url: attachment.url,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              durationSec: attachment.durationSec,
            })),
          }
        : null,
    };
  }

  private emitConversationUpdate(
    conversationId: string,
    userIds: number[],
    messageId?: string,
  ) {
    const payload: StreamPayload = {
      type: 'conversation.updated',
      conversationId,
      messageId,
      at: new Date().toISOString(),
    };

    this.emitToUsers(userIds, payload);
  }

  private emitConversationRead(
    conversationId: string,
    userIds: number[],
    messageId?: string,
  ) {
    const payload: StreamPayload = {
      type: 'conversation.read',
      conversationId,
      messageId,
      at: new Date().toISOString(),
    };

    this.emitToUsers(userIds, payload);
  }

  private emitToUsers(userIds: number[], payload: StreamPayload) {
    new Set(userIds).forEach((userId) => {
      const listeners = this.streams.get(userId);
      if (!listeners) {
        return;
      }

      listeners.forEach((listener) => listener.next(payload));
    });
  }

  private async markConversationAsRead(
    conversationId: string,
    myProfileId: number,
    currentUserId: number,
  ) {
    const conversation = await this.db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participantOne: true,
        participantTwo: true,
      },
    });

    if (!conversation) {
      return;
    }

    const isParticipantOne = conversation.participantOneProfileId === myProfileId;
    const unreadMessages = await this.db.message.findMany({
      where: {
        conversationId,
        senderUserId: {
          not: currentUserId,
        },
        ...(isParticipantOne
          ? { readByParticipantOne: false }
          : { readByParticipantTwo: false }),
      },
      select: {
        id: true,
      },
    });

    if (unreadMessages.length === 0) {
      return;
    }

    await this.db.message.updateMany({
      where: {
        id: {
          in: unreadMessages.map((message) => message.id),
        },
      },
      data: isParticipantOne
        ? {
            readByParticipantOne: true,
            readByParticipantOneAt: new Date(),
          }
        : {
            readByParticipantTwo: true,
            readByParticipantTwoAt: new Date(),
          },
    });

    const otherUserId = await this.getOtherParticipantUserId(
      conversation,
      myProfileId,
    );

    this.emitConversationRead(conversationId, [currentUserId, otherUserId]);
  }

  private async getOtherParticipantUserId(
    conversation: {
      participantOneProfileId: number;
      participantTwoProfileId: number;
    },
    myProfileId: number,
  ) {
    const targetProfileId =
      conversation.participantOneProfileId === myProfileId
        ? conversation.participantTwoProfileId
        : conversation.participantOneProfileId;
    const targetProfile = await this.prisma.profile.findUnique({
      where: {
        id: targetProfileId,
      },
      select: {
        userId: true,
      },
    });

    if (!targetProfile) {
      throw new NotFoundException('Recipient profile not found');
    }

    return targetProfile.userId;
  }

  private getMessagePreview(
    message: any,
  ) {
    if (!message) {
      return '';
    }

    if (message.kind === 'voice') {
      return 'Голосовое сообщение';
    }

    if (message.attachments.some((attachment) => attachment.kind === 'image')) {
      return message.text || 'Изображение';
    }

    if (message.attachments.length > 0) {
      return message.text || 'Вложение';
    }

    return message.text;
  }

  private getAttachmentKind(mimeType: string, isVoiceNote: boolean) {
    if (isVoiceNote) {
      return 'voice';
    }

    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }

    return 'file';
  }

  private resolveMessageKind(input: {
    hasText: boolean;
    hasFiles: boolean;
    isVoiceNote: boolean;
  }) {
    if (input.isVoiceNote) {
      return 'voice';
    }

    if (input.hasFiles && !input.hasText) {
      return 'files';
    }

    if (input.hasFiles && input.hasText) {
      return 'mixed';
    }

    return 'text';
  }

  private sortProfilePair(firstProfileId: number, secondProfileId: number) {
    return firstProfileId < secondProfileId
      ? ([firstProfileId, secondProfileId] as const)
      : ([secondProfileId, firstProfileId] as const);
  }

  private async getRequiredProfile(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async getOnlineUserIds(userIds: number[]) {
    if (userIds.length === 0) {
      return new Set<number>();
    }

    const threshold = new Date(Date.now() - ONLINE_WINDOW_MS);
    const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT "id"
      FROM "User"
      WHERE
        "id" IN (${Prisma.join(userIds)})
        AND "lastSeenAt" IS NOT NULL
        AND "lastSeenAt" >= ${threshold}
    `;

    return new Set(rows.map((row) => row.id));
  }

  private async isUserIdOnline(userId: number) {
    const onlineIds = await this.getOnlineUserIds([userId]);
    return onlineIds.has(userId);
  }

  private normalizeOptionalText(text?: string) {
    const normalized = String(text || '').trim();

    if (!normalized) {
      return '';
    }

    if (normalized.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException('Сообщение слишком длинное');
    }

    return normalized;
  }

  private normalizeRequiredText(text?: string) {
    const normalized = this.normalizeOptionalText(text);

    if (!normalized) {
      throw new BadRequestException('Message cannot be empty');
    }

    return normalized;
  }

  private normalizeVoiceDuration(duration?: number | string | null) {
    if (
      duration === null ||
      duration === undefined ||
      (typeof duration === 'string' && duration.trim() === '')
    ) {
      return null;
    }

    const normalized = Number(duration);

    if (!Number.isFinite(normalized) || normalized <= 0) {
      throw new BadRequestException('Некорректная длительность голосового');
    }

    if (normalized > VOICE_MESSAGE_MAX_DURATION_SEC) {
      throw new BadRequestException(
        'Длительность голосового не должна превышать 5 минут',
      );
    }

    return Math.round(normalized);
  }

  private normalizeBoolean(value: unknown) {
    return value === true || value === 'true' || value === '1' || value === 1;
  }
}
