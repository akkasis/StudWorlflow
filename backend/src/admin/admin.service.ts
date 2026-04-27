import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService, UserRole } from '../moderation/moderation.service';
import { ProfileMetaService } from '../profiles/profile-meta.service';
import { ROOT_ADMIN_EMAIL } from '../auth/auth.constants';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private profileMetaService: ProfileMetaService,
  ) {}

  async getOverview() {
    const [users, profiles, reviews] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.profile.count(),
      this.prisma.review.count(),
    ]);

    return { users, profiles, reviews };
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

    return Promise.all(
      users.map(async (user) => {
        const moderation = await this.moderationService.getUserState(user.id);
        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
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
              }
            : null,
          tutorVerified: moderation.tutorVerified || false,
          ban: moderation.ban || null,
          createdAt: user.createdAt,
        };
      }),
    );
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
}
