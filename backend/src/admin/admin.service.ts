import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService, UserRole } from '../moderation/moderation.service';
import { ProfileMetaService } from '../profiles/profile-meta.service';
import { ROOT_ADMIN_EMAIL } from '../auth/auth.constants';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private profileMetaService: ProfileMetaService,
  ) {}

  async getOverview() {
    const [users, profiles, reviews, students, tutors, onlineUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.profile.count(),
      this.prisma.review.count(),
      this.prisma.user.count({
        where: { role: 'student' },
      }),
      this.prisma.user.count({
        where: { role: 'tutor' },
      }),
      this.getOnlineUserCount(),
    ]);

    return { users, profiles, reviews, students, tutors, onlineUsers };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const onlineUserIds = await this.getOnlineUserIds(users.map((user) => user.id));

    return Promise.all(
      users.map(async (user) => {
        const moderation = await this.moderationService.getUserState(user.id);
        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
          isOnline: onlineUserIds.has(user.id),
          profile: user.profile
            ? {
                id: String(user.profile.id),
                name: user.profile.name,
                university: user.profile.university,
                course: user.profile.course,
                role: user.profile.role,
                rating: user.profile.rating,
                description: user.profile.description,
                pricePerHour: user.profile.priceFrom,
                avatar: user.profile.avatarUrl,
              }
            : null,
          tutorVerified: moderation.tutorVerified || false,
          ban: moderation.ban || null,
          createdAt: user.createdAt,
        };
      }),
    );
  }

  async getUserContext(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const moderation = await this.moderationService.getUserState(userId);
    const isOnline = await this.isUserIdOnline(user.id);
    const availability = user.profile
      ? await this.profileMetaService.getAvailability(user.profile.id)
      : null;
    const banner = user.profile
      ? await this.profileMetaService.getBanner(user.profile.id)
      : null;

    const supportMessages = await this.prisma.$queryRaw<
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
      ORDER BY "createdAt" DESC
      LIMIT 8
    `;

    const conversationRows = user.profile
      ? await this.prisma.$queryRaw<
          Array<{
            id: string;
            participantOneProfileId: number;
            participantTwoProfileId: number;
            updatedAt: Date;
          }>
        >`
          SELECT
            "id",
            "participantOneProfileId",
            "participantTwoProfileId",
            "updatedAt"
          FROM "Conversation"
          WHERE
            "participantOneProfileId" = ${user.profile.id}
            OR "participantTwoProfileId" = ${user.profile.id}
          ORDER BY "updatedAt" DESC
          LIMIT 8
        `
      : [];

    const partnerProfileIds = conversationRows.map((conversation) =>
      conversation.participantOneProfileId === user.profile?.id
        ? conversation.participantTwoProfileId
        : conversation.participantOneProfileId,
    );

    const partnerProfiles = partnerProfileIds.length
      ? await this.prisma.profile.findMany({
          where: {
            id: {
              in: partnerProfileIds,
            },
          },
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        })
      : [];

    const partnersById = new Map(partnerProfiles.map((profile) => [profile.id, profile]));

    const recentConversations = await Promise.all(
      conversationRows.map(async (conversation) => {
        const [lastMessage] = await this.prisma.$queryRaw<
          Array<{
            text: string;
            createdAt: Date;
            senderUserId: number;
          }>
        >`
          SELECT
            "text",
            "createdAt",
            "senderUserId"
          FROM "Message"
          WHERE "conversationId" = ${conversation.id}
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;

        const partnerProfileId =
          conversation.participantOneProfileId === user.profile?.id
            ? conversation.participantTwoProfileId
            : conversation.participantOneProfileId;
        const partner = partnersById.get(partnerProfileId);

        return {
          id: conversation.id,
          partnerName: partner?.name || partner?.user.email || 'Пользователь',
          partnerEmail: partner?.user.email || '',
          partnerRole: partner?.user.role || partner?.role || 'student',
          lastMessage: lastMessage?.text || '',
          updatedAt: lastMessage?.createdAt || conversation.updatedAt,
        };
      }),
    );

    return {
      user: {
        id: String(user.id),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isOnline,
        tutorVerified: moderation.tutorVerified || false,
        ban: moderation.ban || null,
      },
      profile: user.profile
        ? {
            id: String(user.profile.id),
            name: user.profile.name,
            university: user.profile.university,
            course: user.profile.course,
            role: user.profile.role,
            rating: user.profile.rating,
            description: user.profile.description,
            pricePerHour: user.profile.priceFrom,
            avatar: user.profile.avatarUrl,
            banner,
            availability,
            isOnline,
          }
        : null,
      supportMessages: supportMessages.map((message) => ({
        id: message.id,
        senderUserId: message.senderUserId,
        text: message.text,
        createdAt: message.createdAt,
      })),
      recentConversations,
    };
  }

  async listConversations(rawQuery?: string) {
    const query = String(rawQuery || '').trim().toLowerCase();
    const conversations = await this.prisma.$queryRaw<
      Array<{
        id: string;
        participantOneProfileId: number;
        participantTwoProfileId: number;
        updatedAt: Date;
      }>
    >`
      SELECT
        "id",
        "participantOneProfileId",
        "participantTwoProfileId",
        "updatedAt"
      FROM "Conversation"
      ORDER BY "updatedAt" DESC
    `;

    const profileIds = Array.from(
      new Set(
        conversations.flatMap((conversation) => [
          conversation.participantOneProfileId,
          conversation.participantTwoProfileId,
        ]),
      ),
    );

    const profiles = profileIds.length
      ? await this.prisma.profile.findMany({
          where: {
            id: {
              in: profileIds,
            },
          },
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        })
      : [];

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    const messageRows = conversations.length
      ? await this.prisma.$queryRaw<
          Array<{
            conversationId: string;
            text: string;
            createdAt: Date;
          }>
        >`
          SELECT DISTINCT ON ("conversationId")
            "conversationId",
            "text",
            "createdAt"
          FROM "Message"
          WHERE "conversationId" IN (${Prisma.join(
            conversations.map((conversation) => conversation.id),
          )})
          ORDER BY "conversationId", "createdAt" DESC
        `
      : [];

    const messagesByConversationId = new Map(
      messageRows.map((message) => [message.conversationId, message]),
    );

    return conversations
      .map((conversation) => {
        const participantOne = profilesById.get(conversation.participantOneProfileId);
        const participantTwo = profilesById.get(conversation.participantTwoProfileId);
        const lastMessage = messagesByConversationId.get(conversation.id);

        if (!participantOne || !participantTwo) {
          return null;
        }

        return {
          id: conversation.id,
          updatedAt: conversation.updatedAt,
          participantOne: {
            profileId: String(participantOne.id),
            userId: String(participantOne.userId),
            name: participantOne.name,
            email: participantOne.user.email,
            role:
              participantOne.user.role === 'tutor'
                ? 'tutor'
                : participantOne.role,
            avatar: participantOne.avatarUrl,
          },
          participantTwo: {
            profileId: String(participantTwo.id),
            userId: String(participantTwo.userId),
            name: participantTwo.name,
            email: participantTwo.user.email,
            role:
              participantTwo.user.role === 'tutor'
                ? 'tutor'
                : participantTwo.role,
            avatar: participantTwo.avatarUrl,
          },
          lastMessage: lastMessage?.text || '',
          lastMessageAt: lastMessage?.createdAt || conversation.updatedAt,
        };
      })
      .filter(Boolean)
      .filter((conversation) => {
        if (!query) {
          return true;
        }

        return (
          conversation.participantOne.name.toLowerCase().includes(query) ||
          conversation.participantOne.email.toLowerCase().includes(query) ||
          conversation.participantTwo.name.toLowerCase().includes(query) ||
          conversation.participantTwo.email.toLowerCase().includes(query) ||
          conversation.lastMessage.toLowerCase().includes(query)
        );
      });
  }

  async getConversation(conversationId: string) {
    const [conversation] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        participantOneProfileId: number;
        participantTwoProfileId: number;
      }>
    >`
      SELECT
        "id",
        "participantOneProfileId",
        "participantTwoProfileId"
      FROM "Conversation"
      WHERE "id" = ${conversationId}
      LIMIT 1
    `;

    if (!conversation) {
      throw new BadRequestException('Диалог не найден');
    }

    const [participantOne, participantTwo, messages] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { id: conversation.participantOneProfileId },
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.profile.findUnique({
        where: { id: conversation.participantTwoProfileId },
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.$queryRaw<
        Array<{
          id: string;
          senderUserId: number;
          text: string;
          createdAt: Date;
          senderEmail: string;
          senderName: string | null;
          senderAvatar: string | null;
        }>
      >`
        SELECT
          m."id",
          m."senderUserId",
          m."text",
          m."createdAt",
          u."email" AS "senderEmail",
          p."name" AS "senderName",
          p."avatarUrl" AS "senderAvatar"
        FROM "Message" m
        JOIN "User" u ON u."id" = m."senderUserId"
        LEFT JOIN "Profile" p ON p."userId" = u."id"
        WHERE m."conversationId" = ${conversationId}
        ORDER BY m."createdAt" ASC
      `,
    ]);

    if (!participantOne || !participantTwo) {
      throw new BadRequestException('Участники диалога не найдены');
    }

    return {
      id: conversation.id,
      participantOne: {
        profileId: String(participantOne.id),
        userId: String(participantOne.userId),
        name: participantOne.name,
        email: participantOne.user.email,
        role:
          participantOne.user.role === 'tutor'
            ? 'tutor'
            : participantOne.role,
        avatar: participantOne.avatarUrl,
      },
      participantTwo: {
        profileId: String(participantTwo.id),
        userId: String(participantTwo.userId),
        name: participantTwo.name,
        email: participantTwo.user.email,
        role:
          participantTwo.user.role === 'tutor'
            ? 'tutor'
            : participantTwo.role,
        avatar: participantTwo.avatarUrl,
      },
      messages: messages.map((message) => ({
        id: message.id,
        senderUserId: String(message.senderUserId),
        senderName: message.senderName || message.senderEmail,
        senderAvatar: message.senderAvatar || null,
        text: message.text,
        createdAt: message.createdAt,
      })),
    };
  }

  async listReviews() {
    const reviews = await this.prisma.review.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        profile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      reviews.map(async (review) => {
        const moderation = await this.moderationService.getReviewState(review.id);
        return {
          id: review.id,
          text: review.text,
          rating: review.rating,
          profileId: String(review.profileId),
          authorUserId: String(review.userId),
          tutorUserId: String(review.profile.userId),
          tutorName: review.profile.name,
          userName: review.user.profile?.name || review.user.email,
          verified: moderation.verified || false,
          createdAt: review.createdAt,
        };
      }),
    );
  }

  async updateUser(
    actingEmail: string,
    userId: number,
    body: {
      role?: UserRole;
      tutorVerified?: boolean;
      banType?: 'temporary' | 'permanent' | 'clear';
      banDays?: number;
      banReason?: string;
    },
  ) {
    if (body.role && actingEmail !== ROOT_ADMIN_EMAIL) {
      throw new ForbiddenException('Только главный администратор может менять роли');
    }

    if (body.role) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: body.role,
        },
      });
    }

    const state = await this.moderationService.getUserState(userId);
    let ban = state.ban || null;

    if (body.banType === 'clear') {
      ban = null;
    }

    if (body.banType === 'permanent') {
      ban = {
        permanent: true,
        reason: body.banReason || 'Решение модерации',
      };
    }

    if (body.banType === 'temporary') {
      if (!body.banDays) {
        throw new BadRequestException('Нужно указать количество дней бана');
      }

      const until = new Date();
      until.setDate(until.getDate() + Number(body.banDays));
      ban = {
        until: until.toISOString(),
        reason: body.banReason || 'Временное ограничение доступа',
      };
    }

    await this.moderationService.setUserState(userId, {
      tutorVerified: body.tutorVerified ?? state.tutorVerified ?? false,
      ban,
    });

    return { success: true };
  }

  async updateReview(
    reviewId: number,
    body: { text?: string; rating?: number; verified?: boolean },
  ) {
    if (body.text !== undefined || body.rating !== undefined) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          text: body.text,
          rating: body.rating,
        },
      });
    }

    if (body.verified !== undefined) {
      await this.moderationService.setReviewState(reviewId, {
        verified: body.verified,
      });
    }

    return { success: true };
  }

  async deleteReview(reviewId: number) {
    await this.prisma.review.delete({
      where: { id: reviewId },
    });
    return { success: true };
  }

  async updateProfile(
    profileId: number,
    body: {
      name?: string;
      course?: number;
      description?: string;
      pricePerHour?: number;
      avatar?: string | null;
      availability?: {
        formats?: string[];
        primeDays?: string[];
        primeTime?: string;
        note?: string;
      };
    },
  ) {
    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        name: body.name,
        course: body.course,
        description: body.description,
        priceFrom: body.pricePerHour,
        avatarUrl: body.avatar || undefined,
      },
    });

    if (body.availability) {
      await this.profileMetaService.setAvailability(profileId, body.availability);
    }

    return { success: true };
  }

  async deleteUser(actingUserId: number, actingRole: string, userId: number) {
    if (actingRole !== 'admin') {
      throw new ForbiddenException('Удалять аккаунты может только администратор');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    if (user.email === ROOT_ADMIN_EMAIL) {
      throw new ForbiddenException('Нельзя удалить главного администратора');
    }

    if (actingUserId === userId) {
      throw new ForbiddenException('Нельзя удалить собственный аккаунт из админки');
    }

    await this.prisma.$transaction(async (tx) => {
      const authoredReviews = await tx.review.findMany({
        where: { userId },
        select: { id: true },
      });

      const profileReviews = user.profile
        ? await tx.review.findMany({
            where: { profileId: user.profile.id },
            select: { id: true },
          })
        : [];

      const reviewIds = Array.from(
        new Set([...authoredReviews, ...profileReviews].map((review) => review.id)),
      );

      if (reviewIds.length > 0) {
        await tx.$executeRaw`
          DELETE FROM "ReviewModerationState"
          WHERE "reviewId" = ANY(${reviewIds}::int[])
        `;
      }

      await tx.review.deleteMany({
        where: {
          OR: [
            { userId },
            ...(user.profile ? [{ profileId: user.profile.id }] : []),
          ],
        },
      });

      if (user.profile) {
        await tx.profileTag.deleteMany({
          where: { profileId: user.profile.id },
        });

        await tx.profile.delete({
          where: { id: user.profile.id },
        });
      }

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { success: true };
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
    const onlineUserIds = await this.getOnlineUserIds([userId]);
    return onlineUserIds.has(userId);
  }

  private async getOnlineUserCount() {
    const threshold = new Date(Date.now() - ONLINE_WINDOW_MS);
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS "count"
      FROM "User"
      WHERE
        "lastSeenAt" IS NOT NULL
        AND "lastSeenAt" >= ${threshold}
    `;

    return Number(rows[0]?.count || 0);
  }
}
