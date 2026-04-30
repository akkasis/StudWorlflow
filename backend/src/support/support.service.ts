import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  lastSenderUserId: number | null;
}

export interface SupportThreadResponse {
  userId: string;
  messages: SupportMessage[];
}

const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async listThreads() {
    const threads = await this.prisma.$queryRaw<
      Array<{
        userId: number;
        updatedAt: Date;
        lastMessage: string | null;
        lastSenderUserId: number | null;
      }>
    >`
      SELECT
        st."userId",
        st."updatedAt",
        (
          SELECT sm."text"
          FROM "SupportMessage" sm
          WHERE sm."threadUserId" = st."userId"
          ORDER BY sm."createdAt" DESC
          LIMIT 1
        ) AS "lastMessage",
        (
          SELECT sm."senderUserId"
          FROM "SupportMessage" sm
          WHERE sm."threadUserId" = st."userId"
          ORDER BY sm."createdAt" DESC
          LIMIT 1
        ) AS "lastSenderUserId"
      FROM "SupportThread" st
      ORDER BY st."updatedAt" DESC
    `;

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: threads.map((thread) => thread.userId),
        },
      },
      include: {
        profile: true,
      },
    });

    const usersById = new Map(users.map((user) => [user.id, user]));

    return threads.map((thread) => {
      const user = usersById.get(thread.userId);

      return {
        userId: String(thread.userId),
        email: user?.email || 'unknown',
        name: user?.profile?.name || user?.email || 'Пользователь',
        lastMessage: thread.lastMessage || '',
        updatedAt: thread.updatedAt,
        lastSenderUserId: thread.lastSenderUserId,
      };
    });
  }

  async getThreadForUser(userId: number) {
    const thread = await this.getOrCreateThread(userId);
    const messages = await this.prisma.$queryRaw<
      Array<{
        id: string;
        senderUserId: number;
        text: string;
        createdAt: Date;
      }>
    >`
      SELECT
        "id",
        "senderUserId",
        "text",
        "createdAt"
      FROM "SupportMessage"
      WHERE "threadUserId" = ${userId}
      ORDER BY "createdAt" ASC
    `;

    return {
      userId: String(thread.userId),
      messages: messages.map((message) => ({
        id: message.id,
        senderUserId: message.senderUserId,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  async sendUserMessage(userId: number, text: string) {
    await this.getOrCreateThread(userId);
    const normalized = this.normalizeText(text);

    const [message] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        senderUserId: number;
        text: string;
        createdAt: Date;
      }>
    >`
      INSERT INTO "SupportMessage" (
        "id",
        "threadUserId",
        "senderUserId",
        "text"
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        ${userId},
        ${normalized}
      )
      RETURNING
        "id",
        "senderUserId",
        "text",
        "createdAt"
    `;

    await this.prisma.$executeRaw`
      UPDATE "SupportThread"
      SET "updatedAt" = ${message.createdAt}
      WHERE "userId" = ${userId}
    `;

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async sendModeratorReply(
    targetUserId: number,
    moderatorUserId: number,
    text: string,
  ) {
    await this.getOrCreateThread(targetUserId);
    const normalized = this.normalizeText(text);

    const [message] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        senderUserId: number;
        text: string;
        createdAt: Date;
      }>
    >`
      INSERT INTO "SupportMessage" (
        "id",
        "threadUserId",
        "senderUserId",
        "text"
      )
      VALUES (
        ${randomUUID()},
        ${targetUserId},
        ${moderatorUserId},
        ${normalized}
      )
      RETURNING
        "id",
        "senderUserId",
        "text",
        "createdAt"
    `;

    await this.prisma.$executeRaw`
      UPDATE "SupportThread"
      SET "updatedAt" = ${message.createdAt}
      WHERE "userId" = ${targetUserId}
    `;

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private normalizeText(text: string) {
    const normalized = String(text || '').trim();

    if (!normalized) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    if (normalized.length > SUPPORT_MESSAGE_MAX_LENGTH) {
      throw new BadRequestException('Сообщение слишком длинное');
    }

    return normalized;
  }

  private async getOrCreateThread(userId: number) {
    await this.prisma.$executeRaw`
      INSERT INTO "SupportThread" ("userId")
      VALUES (${userId})
      ON CONFLICT ("userId") DO NOTHING
    `;

    const [thread] = await this.prisma.$queryRaw<
      Array<{
        userId: number;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT
        "userId",
        "createdAt",
        "updatedAt"
      FROM "SupportThread"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    return thread;
  }
}
