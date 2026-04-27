import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

interface StoredMessage {
  id: string;
  senderUserId: number;
  text: string;
  createdAt: string;
  readByUserIds: number[];
}

interface StoredConversation {
  id: string;
  participantUserIds: [number, number];
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

interface MessagesStore {
  conversations: StoredConversation[];
}

@Injectable()
export class MessagesService {
  private readonly storePath = join(process.cwd(), 'data', 'messages.json');

  constructor(private prisma: PrismaService) {}

  async getConversations(userId: number) {
    const store = await this.readStore();
    const myConversations = store.conversations
      .filter((conversation) => conversation.participantUserIds.includes(userId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    const partnerUserIds = myConversations.map((conversation) =>
      this.getPartnerUserId(conversation, userId),
    );

    const profiles = await this.prisma.profile.findMany({
      where: {
        userId: {
          in: partnerUserIds,
        },
      },
    });

    const profilesByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

    return myConversations
      .map((conversation) => {
        const partnerUserId = this.getPartnerUserId(conversation, userId);
        const partnerProfile = profilesByUserId.get(partnerUserId);

        if (!partnerProfile) {
          return null;
        }

        const lastMessage =
          conversation.messages[conversation.messages.length - 1];
        const unreadCount = conversation.messages.filter(
          (message) =>
            message.senderUserId !== userId &&
            !message.readByUserIds.includes(userId),
        ).length;

        return {
          id: conversation.id,
          profileId: String(partnerProfile.id),
          name: partnerProfile.name,
          avatar: partnerProfile.avatarUrl,
          role: partnerProfile.role,
          university: partnerProfile.university,
          lastMessage: lastMessage?.text || '',
          timestamp: lastMessage?.createdAt || conversation.updatedAt,
          unreadCount,
        };
      })
      .filter(Boolean);
  }

  async getConversation(userId: number, profileId: number) {
    const [myProfile, targetProfile] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
      }),
      this.prisma.profile.findUnique({
        where: { id: profileId },
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

    const store = await this.readStore();
    const conversation = this.findConversation(
      store.conversations,
      userId,
      targetProfile.userId,
    );

    if (conversation) {
      let didChange = false;
      for (const message of conversation.messages) {
        if (
          message.senderUserId !== userId &&
          !message.readByUserIds.includes(userId)
        ) {
          message.readByUserIds.push(userId);
          didChange = true;
        }
      }

      if (didChange) {
        await this.writeStore(store);
      }
    }

    return {
      conversationId: conversation?.id || null,
      participant: {
        profileId: String(targetProfile.id),
        name: targetProfile.name,
        avatar: targetProfile.avatarUrl,
        role: targetProfile.role,
        university: targetProfile.university,
      },
      messages: (conversation?.messages || []).map((message) => ({
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
      }),
      this.prisma.profile.findUnique({
        where: { id: profileId },
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

    if (myProfile.role !== 'tutor' && targetProfile.role !== 'tutor') {
      throw new BadRequestException(
        'Messages are only available between students and tutors',
      );
    }

    const store = await this.readStore();
    const conversation =
      this.findConversation(store.conversations, userId, targetProfile.userId) ||
      this.createConversation(store.conversations, userId, targetProfile.userId);

    const message: StoredMessage = {
      id: String(Date.now()),
      senderUserId: userId,
      text: normalizedText,
      createdAt: new Date().toISOString(),
      readByUserIds: [userId],
    };

    conversation.messages.push(message);
    conversation.updatedAt = message.createdAt;

    await this.writeStore(store);

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      createdAt: message.createdAt,
    };
  }

  private getPartnerUserId(conversation: StoredConversation, userId: number) {
    return conversation.participantUserIds.find((id) => id !== userId) as number;
  }

  private findConversation(
    conversations: StoredConversation[],
    firstUserId: number,
    secondUserId: number,
  ) {
    return conversations.find((conversation) => {
      const [a, b] = conversation.participantUserIds;
      return (
        (a === firstUserId && b === secondUserId) ||
        (a === secondUserId && b === firstUserId)
      );
    });
  }

  private createConversation(
    conversations: StoredConversation[],
    firstUserId: number,
    secondUserId: number,
  ) {
    const now = new Date().toISOString();
    const conversation: StoredConversation = {
      id: `conversation_${Date.now()}`,
      participantUserIds: [firstUserId, secondUserId],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    conversations.push(conversation);
    return conversation;
  }

  private async readStore(): Promise<MessagesStore> {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });

    try {
      const raw = await fs.readFile(this.storePath, 'utf8');
      return JSON.parse(raw) as MessagesStore;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const emptyStore = { conversations: [] };
        await this.writeStore(emptyStore);
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: MessagesStore) {
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2), 'utf8');
  }
}
