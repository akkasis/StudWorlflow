import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface SupportMessage {
  id: string;
  senderUserId: number;
  text: string;
  createdAt: string;
}

export interface SupportThread {
  userId: number;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportThreadSummary {
  userId: string;
  email: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}

export interface SupportThreadResponse {
  userId: string;
  messages: SupportMessage[];
}

interface SupportStore {
  threads: SupportThread[];
}

@Injectable()
export class SupportService {
  private readonly storePath = join(process.cwd(), 'data', 'support.json');

  constructor(private prisma: PrismaService) {}

  async listThreads() {
    const store = await this.readStore();
    const userIds = store.threads.map((thread) => thread.userId);
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      include: {
        profile: true,
      },
    });

    const usersById = new Map(users.map((user) => [user.id, user]));

    return store.threads
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map((thread) => {
        const user = usersById.get(thread.userId);
        const lastMessage = thread.messages[thread.messages.length - 1];
        return {
          userId: String(thread.userId),
          email: user?.email || 'unknown',
          name: user?.profile?.name || user?.email || 'Пользователь',
          lastMessage: lastMessage?.text || '',
          updatedAt: thread.updatedAt,
        };
      });
  }

  async getThreadForUser(userId: number) {
    const store = await this.readStore();
    const thread = this.getOrCreateThread(store, userId);
    await this.writeStore(store);

    return {
      userId: String(thread.userId),
      messages: thread.messages,
    };
  }

  async sendUserMessage(userId: number, text: string) {
    const store = await this.readStore();
    const thread = this.getOrCreateThread(store, userId);
    const message = this.createMessage(userId, text);
    thread.messages.push(message);
    thread.updatedAt = message.createdAt;
    await this.writeStore(store);
    return message;
  }

  async sendModeratorReply(targetUserId: number, moderatorUserId: number, text: string) {
    const store = await this.readStore();
    const thread = this.getOrCreateThread(store, targetUserId);
    const message = this.createMessage(moderatorUserId, text);
    thread.messages.push(message);
    thread.updatedAt = message.createdAt;
    await this.writeStore(store);
    return message;
  }

  private createMessage(senderUserId: number, text: string): SupportMessage {
    const normalized = text.trim();
    if (!normalized) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    return {
      id: String(Date.now()),
      senderUserId,
      text: normalized,
      createdAt: new Date().toISOString(),
    };
  }

  private getOrCreateThread(store: SupportStore, userId: number) {
    let thread = store.threads.find((item) => item.userId === userId);
    if (!thread) {
      const now = new Date().toISOString();
      thread = {
        userId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      store.threads.push(thread);
    }
    return thread;
  }

  private async readStore(): Promise<SupportStore> {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });

    try {
      const raw = await fs.readFile(this.storePath, 'utf8');
      return JSON.parse(raw) as SupportStore;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const emptyStore: SupportStore = {
          threads: [],
        };
        await this.writeStore(emptyStore);
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: SupportStore) {
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2), 'utf8');
  }
}
