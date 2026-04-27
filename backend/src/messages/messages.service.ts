import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface ConversationRow {
  id: string;
  participantOneProfileId: number;
  participantTwoProfileId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRow {
  id: string;
  conversationId: string;
  senderUserId: number;
  text: string;
  createdAt: Date;
  readByParticipantOne: boolean;
  readByParticipantTwo: boolean;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: number) {
    const myProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!myProfile) {
      throw new NotFoundException('Profile not found');
    }

    const conversations = await this.prisma.$queryRaw<ConversationRow[]>`
      SELECT
        "id",
        "participantOneProfileId",
        "participantTwoProfileId",
        "createdAt",
        "updatedAt"
      FROM "Conversation"
      WHERE
        "participantOneProfileId" = ${myProfile.id}
        OR "participantTwoProfileId" = ${myProfile.id}
      ORDER BY "updatedAt" DESC
    `;

    const partnerProfileIds = conversations.map((conversation) =>
      conversation.participantOneProfileId === myProfile.id
        ? conversation.participantTwoProfileId
        : conversation.participantOneProfileId,
    );

    const profiles = await this.prisma.profile.findMany({
      where: {
        id: {
          in: partnerProfileIds,
        },
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    const messageRows = conversations.length
      ? await this.prisma.$queryRaw<MessageRow[]>`
          SELECT
            "id",
            "conversationId",
            "senderUserId",
            "text",
            "createdAt",
            "readByParticipantOne",
            "readByParticipantTwo"
          FROM "Message"
          WHERE "conversationId" IN (${Prisma.join(
            conversations.map((conversation) => conversation.id),
          )})
          ORDER BY "createdAt" ASC
        `
      : [];
    const messagesByConversationId = new Map<string, MessageRow[]>();

    for (const message of messageRows) {
      const current = messagesByConversationId.get(message.conversationId) || [];
      current.push(message);
      messagesByConversationId.set(message.conversationId, current);
    }

    const summaries = conversations.map((conversation) => {
      const isParticipantOne = conversation.participantOneProfileId === myProfile.id;
      const partnerProfileId = isParticipantOne
        ? conversation.participantTwoProfileId
        : conversation.participantOneProfileId;
      const partnerProfile = profilesById.get(partnerProfileId);
      const messages = messagesByConversationId.get(conversation.id) || [];
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter((message) =>
        message.senderUserId !== userId &&
        (isParticipantOne
          ? !message.readByParticipantOne
          : !message.readByParticipantTwo),
      ).length;

      if (!partnerProfile) {
        return null;
      }

      return {
        id: conversation.id,
        profileId: String(partnerProfile.id),
        name: partnerProfile.name,
        avatar: partnerProfile.avatarUrl,
        role: partnerProfile.user.role === 'tutor' ? 'tutor' : partnerProfile.role,
        university: partnerProfile.university,
        lastMessage: lastMessage?.text || '',
        timestamp: lastMessage?.createdAt || conversation.updatedAt,
        unreadCount,
      };
    });

    return summaries.filter(Boolean);
  }

  async getConversation(userId: number, profileId: number) {
    const [myProfile, targetProfile] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
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

    const [participantOneProfileId, participantTwoProfileId] =
      this.sortProfilePair(myProfile.id, targetProfile.id);

    const [conversation] = await this.prisma.$queryRaw<ConversationRow[]>`
      SELECT
        "id",
        "participantOneProfileId",
        "participantTwoProfileId",
        "createdAt",
        "updatedAt"
      FROM "Conversation"
      WHERE
        "participantOneProfileId" = ${participantOneProfileId}
        AND "participantTwoProfileId" = ${participantTwoProfileId}
      LIMIT 1
    `;

    if (conversation) {
      const isParticipantOne = conversation.participantOneProfileId === myProfile.id;
      if (isParticipantOne) {
        await this.prisma.$executeRaw`
          UPDATE "Message"
          SET "readByParticipantOne" = TRUE
          WHERE
            "conversationId" = ${conversation.id}
            AND "senderUserId" <> ${userId}
            AND "readByParticipantOne" = FALSE
        `;
      } else {
        await this.prisma.$executeRaw`
          UPDATE "Message"
          SET "readByParticipantTwo" = TRUE
          WHERE
            "conversationId" = ${conversation.id}
            AND "senderUserId" <> ${userId}
            AND "readByParticipantTwo" = FALSE
        `;
      }
    }

    const freshMessages = conversation
      ? await this.prisma.$queryRaw<MessageRow[]>`
          SELECT
            "id",
            "conversationId",
            "senderUserId",
            "text",
            "createdAt",
            "readByParticipantOne",
            "readByParticipantTwo"
          FROM "Message"
          WHERE "conversationId" = ${conversation.id}
          ORDER BY "createdAt" ASC
        `
      : [];

    return {
      conversationId: conversation?.id || null,
      participant: {
        profileId: String(targetProfile.id),
        name: targetProfile.name,
        avatar: targetProfile.avatarUrl,
        role: targetProfile.user.role === 'tutor' ? 'tutor' : targetProfile.role,
        university: targetProfile.university,
      },
      messages: freshMessages.map((message) => ({
        id: message.id,
        senderUserId: message.senderUserId,
        text: message.text,
        createdAt: message.createdAt,
      })),
    };
  }

  async sendMessage(userId: number, profileId: number, text: string) {
    const normalizedText = text?.trim();

    if (!normalizedText) {
      throw new BadRequestException('Message cannot be empty');
    }

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
    const isSenderParticipantOne = participantOneProfileId === myProfile.id;
    const conversationId = `conversation_${participantOneProfileId}_${participantTwoProfileId}`;

    await this.prisma.$executeRaw`
      INSERT INTO "Conversation" (
        "id",
        "participantOneProfileId",
        "participantTwoProfileId"
      )
      VALUES (
        ${conversationId},
        ${participantOneProfileId},
        ${participantTwoProfileId}
      )
      ON CONFLICT ("participantOneProfileId", "participantTwoProfileId")
      DO NOTHING
    `;

    const [message] = await this.prisma.$queryRaw<MessageRow[]>`
      INSERT INTO "Message" (
        "id",
        "conversationId",
        "senderUserId",
        "text",
        "readByParticipantOne",
        "readByParticipantTwo"
      )
      VALUES (
        ${randomUUID()},
        ${conversationId},
        ${userId},
        ${normalizedText},
        ${isSenderParticipantOne},
        ${!isSenderParticipantOne}
      )
      RETURNING
        "id",
        "conversationId",
        "senderUserId",
        "text",
        "createdAt",
        "readByParticipantOne",
        "readByParticipantTwo"
    `;

    await this.prisma.$executeRaw`
      UPDATE "Conversation"
      SET "updatedAt" = ${message.createdAt}
      WHERE "id" = ${conversationId}
    `;

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      createdAt: message.createdAt,
    };
  }

  private sortProfilePair(firstProfileId: number, secondProfileId: number) {
    return firstProfileId < secondProfileId
      ? [firstProfileId, secondProfileId] as const
      : [secondProfileId, firstProfileId] as const;
  }
}
