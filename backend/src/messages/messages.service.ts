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
  participantProfileIds?: [number, number];
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

    const partnerProfileIds = myConversations.map((conversation) =>
      this.getPartnerProfileId(conversation, userId),
    );

    const profiles = await this.prisma.profile.findMany({
      where: {
        id: {
          in: partnerProfileIds,
        },
      },
    });

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return myConversations
      .map((conversation) => {
        const partnerProfileId = this.getPartnerProfileId(conversation, userId);
        const partnerProfile = profilesById.get(partnerProfileId);

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
      myProfile.id,
      targetProfile.userId,
      targetProfile.id,
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
      this.findConversation(
        store.conversations,
        userId,
        myProfile.id,
        targetProfile.userId,
        targetProfile.id,
      ) ||
      this.createConversation(
        store.conversations,
        userId,
        myProfile.id,
        targetProfile.userId,
        targetProfile.id,
      );

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

  private getPartnerProfileId(conversation: StoredConversation, userId: number) {
    const userIndex = conversation.participantUserIds.findIndex((id) => id === userId);
    const partnerIndex = userIndex === 0 ? 1 : 0;
    return conversation.participantProfileIds?.[partnerIndex] as number;
  }

  private findConversation(
    conversations: StoredConversation[],
    firstUserId: number,
    firstProfileId: number,
    secondUserId: number,
    secondProfileId: number,
  ) {
    return conversations.find((conversation) => {
      const [a, b] = conversation.participantUserIds;
      const [profileA, profileB] = conversation.participantProfileIds || [];
      return (
        (a === firstUserId &&
          b === secondUserId &&
          profileA === firstProfileId &&
          profileB === secondProfileId) ||
        (a === secondUserId &&
          b === firstUserId &&
          profileA === secondProfileId &&
          profileB === firstProfileId)
      );
    });
  }

  private createConversation(
    conversations: StoredConversation[],
    firstUserId: number,
    firstProfileId: number,
    secondUserId: number,
    secondProfileId: number,
  ) {
    const now = new Date().toISOString();
    const conversation: StoredConversation = {
      id: `conversation_${Date.now()}`,
      participantUserIds: [firstUserId, secondUserId],
      participantProfileIds: [firstProfileId, secondProfileId],
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
      const parsed = JSON.parse(raw) as Partial<MessagesStore>;
      const normalized = this.normalizeStore(parsed);

      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        await this.writeStore(normalized);
      }

      return normalized;
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

  private normalizeStore(store: Partial<MessagesStore>): MessagesStore {
    return {
      conversations: (store.conversations || [])
        .map((conversation) => this.normalizeConversation(conversation))
        .filter((conversation): conversation is StoredConversation => Boolean(conversation)),
    };
  }

  private normalizeConversation(
    conversation: Partial<StoredConversation> | undefined,
  ): StoredConversation | null {
    if (!conversation) {
      return null;
    }

    const participantUserIds = this.normalizeIdPair(conversation.participantUserIds);
    const participantProfileIds = this.normalizeIdPair(conversation.participantProfileIds);

    // We intentionally discard legacy conversations without profile ids:
    // otherwise recreated users can inherit old threads after id reuse.
    if (!participantUserIds || !participantProfileIds) {
      return null;
    }

    const messages = (conversation.messages || [])
      .map((message) => this.normalizeMessage(message, participantUserIds))
      .filter((message): message is StoredMessage => Boolean(message));

    return {
      id: conversation.id || `conversation_${Date.now()}`,
      participantUserIds,
      participantProfileIds,
      messages,
      createdAt: conversation.createdAt || new Date().toISOString(),
      updatedAt:
        messages[messages.length - 1]?.createdAt ||
        conversation.updatedAt ||
        conversation.createdAt ||
        new Date().toISOString(),
    };
  }

  private normalizeIdPair(value: unknown): [number, number] | null {
    if (!Array.isArray(value) || value.length !== 2) {
      return null;
    }

    const first = Number(value[0]);
    const second = Number(value[1]);

    if (!Number.isInteger(first) || !Number.isInteger(second)) {
      return null;
    }

    return [first, second];
  }

  private normalizeMessage(
    message: Partial<StoredMessage> | undefined,
    participantUserIds: [number, number],
  ): StoredMessage | null {
    if (!message) {
      return null;
    }

    const senderUserId = Number(message.senderUserId);
    const text = message.text?.trim();

    if (!participantUserIds.includes(senderUserId) || !text) {
      return null;
    }

    const readByUserIds = Array.isArray(message.readByUserIds)
      ? message.readByUserIds
          .map((id) => Number(id))
          .filter(
            (id, index, list) =>
              Number.isInteger(id) &&
              participantUserIds.includes(id) &&
              list.indexOf(id) === index,
          )
      : [senderUserId];

    if (!readByUserIds.includes(senderUserId)) {
      readByUserIds.push(senderUserId);
    }

    return {
      id: message.id || String(Date.now()),
      senderUserId,
      text,
      createdAt: message.createdAt || new Date().toISOString(),
      readByUserIds,
    };
  }
}
