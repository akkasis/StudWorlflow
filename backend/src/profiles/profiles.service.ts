import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { ProfileMetaService } from './profile-meta.service';

const DEFAULT_UNIVERSITY = 'РАНХиГС';
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const PROFILE_NAME_MAX_LENGTH = 80;
const PROFILE_DESCRIPTION_MAX_LENGTH = 1200;
const TAG_MAX_LENGTH = 40;
const TAG_MAX_COUNT = 12;
const AVAILABILITY_TIME_MAX_LENGTH = 80;
const AVAILABILITY_NOTE_MAX_LENGTH = 300;

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private profileMetaService: ProfileMetaService,
  ) {}

  async create(userId: number, data: any) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    const role = data.role === 'tutor' ? 'tutor' : 'student';
    const tags = role === 'tutor' ? data.tags || [] : [];

    return this.prisma.profile.create({
      data: {
        userId,
        role,

        name: this.normalizeName(data.name || ''),
        university: DEFAULT_UNIVERSITY,
        course: this.normalizeCourse(data.course || 1),
        description:
          role === 'tutor' ? this.normalizeDescription(data.description || '') : '',
        priceFrom: role === 'tutor' ? Number(data.pricePerHour || 0) : 0,
        averageGrade:
          role === 'tutor'
            ? this.normalizeAverageGrade(data.averageGrade)
            : null,

        profileTags: {
          create: this.normalizeTags(tags).map((tag: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },
      },
    });
  }

  async update(userId: number, data: any) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    const normalizedRole = profile.user.role === 'tutor' ? 'tutor' : 'student';
    const isTutor = normalizedRole === 'tutor';

    await this.prisma.profile.update({
      where: { userId },
      data: {
        role: normalizedRole,
        name: data.name ? this.normalizeName(data.name) : undefined,
        university: DEFAULT_UNIVERSITY,
        course: data.course ? this.normalizeCourse(data.course) : undefined,
        avatarUrl: data.avatar,
        description:
          isTutor && data.description !== undefined
            ? this.normalizeDescription(data.description)
            : undefined,
        priceFrom:
          isTutor && data.pricePerHour !== undefined
            ? Number(data.pricePerHour)
            : undefined,
        averageGrade:
          isTutor && data.averageGrade !== undefined
            ? this.normalizeAverageGrade(data.averageGrade)
            : undefined,

        profileTags: isTutor && data.tags
          ? {
              deleteMany: {},
              create: this.normalizeTags(data.tags).map((tag: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tag },
                    create: { name: tag },
                  },
                },
              })),
            }
          : undefined,
      },
    });

    if (isTutor) {
      await Promise.all([
        this.profileMetaService.setAvailability(
          profile.id,
          this.normalizeAvailability(data.availability),
        ),
        this.profileMetaService.setBanner(profile.id, data.banner),
      ]);
    }

    return this.findByUserId(userId);
  }

  async updateUploadedAsset(
    userId: number,
    kind: 'avatar' | 'banner',
    url: string,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    if (kind === 'avatar') {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          avatarUrl: url,
        },
      });

      return { url };
    }

    if (profile.user.role !== 'tutor') {
      throw new BadRequestException('Баннер доступен только стутьюторам');
    }

    await this.profileMetaService.setBanner(profile.id, url);
    return { url };
  }

  async findAll(query: any) {
    const sort = query.sort;
    const orderBy =
      sort === 'price'
        ? { priceFrom: 'asc' as const }
        : sort === 'newest'
          ? { createdAt: 'desc' as const }
          : { rating: 'desc' as const };

    const profiles = await this.prisma.profile.findMany({
      where: {
        OR: [
          {
            role: 'tutor',
          },
          {
            user: {
              role: 'tutor',
            },
          },
        ],
      },
      orderBy,
      include: {
        user: {
          select: {
            role: true,
          },
        },
        profileTags: {
          include: {
            tag: true,
          },
        },
        reviews: true,
      },
    });

    const onlineUserIds = await this.getOnlineUserIds(
      profiles.map((profile) => profile.userId),
    );

    const normalizedProfiles = await Promise.all(
      profiles.map(async (p) => {
        const moderation = await this.moderationService.getUserState(p.userId);
        const normalizedRole = p.user.role === 'tutor' ? 'tutor' : p.role;
        return {
          id: String(p.id),
          name: p.name,
          avatar: p.avatarUrl,
          university: p.university,
          course: String(p.course),
          tags: p.profileTags.map((t) => t.tag.name),
          rating: p.rating,
          reviewCount: p.reviews.length,
          description: p.description,
          pricePerHour: p.priceFrom,
          averageGrade: p.averageGrade,
          role: normalizedRole,
          verified: moderation.tutorVerified || false,
          isOnline: onlineUserIds.has(p.userId),
        };
      }),
    );

    return normalizedProfiles.sort((a, b) => {
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }

      if (sort === 'price') {
        return a.pricePerHour - b.pricePerHour;
      }

      if (sort === 'newest') {
        return 0;
      }

      return b.rating - a.rating;
    });
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            role: true,
          },
        },
        profileTags: {
          include: {
            tag: true,
          },
        },
        reviews: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    const [moderation, availability, banner] = await Promise.all([
      this.moderationService.getUserState(profile.userId),
      this.profileMetaService.getAvailability(profile.id),
      this.profileMetaService.getBanner(profile.id),
    ]);
    const isOnline = await this.isUserIdOnline(profile.userId);

    const reviews = await Promise.all(
      profile.reviews.map(async (review) => {
        const reviewState = await this.moderationService.getReviewState(review.id);
        return {
          id: review.id,
          userId: review.userId,
          rating: review.rating,
          text: review.text,
          createdAt: review.createdAt,
          userName: review.user.profile?.name || review.user.email,
          verified: reviewState.verified || false,
        };
      }),
    ).then((items) =>
      items.sort((a, b) => {
        if (a.verified !== b.verified) {
          return a.verified ? -1 : 1;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    );

    return {
      id: String(profile.id),
      userId: String(profile.userId),
      name: profile.name,
      avatar: profile.avatarUrl,
      university: profile.university,
      course: String(profile.course),
      role: profile.user.role === 'tutor' ? 'tutor' : profile.role,
      tags: profile.profileTags.map((t) => t.tag.name),
      rating: profile.rating,
      reviewCount: profile.reviews.length,
      description: profile.description,
      pricePerHour: profile.priceFrom,
      averageGrade: profile.averageGrade,
      verified: moderation.tutorVerified || false,
      isOnline,
      banner,
      availability,
      reviews,
    };
  }

  async findByUserId(userId: number) {
    const [profile, recentReviews] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              role: true,
            },
          },
          profileTags: {
            include: {
              tag: true,
            },
          },
          reviews: true,
        },
      }),
      this.prisma.review.findMany({
        where: {
          profile: {
            userId,
          },
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    const [moderation, availability, banner] = await Promise.all([
      this.moderationService.getUserState(profile.userId),
      this.profileMetaService.getAvailability(profile.id),
      this.profileMetaService.getBanner(profile.id),
    ]);
    const isOnline = await this.isUserIdOnline(profile.userId);

    const normalizedRecentReviews = await Promise.all(
      recentReviews.map(async (review) => {
        const reviewState = await this.moderationService.getReviewState(review.id);
        return {
          id: review.id,
          rating: review.rating,
          text: review.text,
          createdAt: review.createdAt,
          userName: review.user.profile?.name || review.user.email,
          verified: reviewState.verified || false,
        };
      }),
    ).then((items) =>
      items.sort((a, b) => {
        if (a.verified !== b.verified) {
          return a.verified ? -1 : 1;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }).slice(0, 3),
    );

    return {
      id: String(profile.id),
      userId: String(profile.userId),
      name: profile.name,
      avatar: profile.avatarUrl,
      university: profile.university,
      course: String(profile.course),
      role: profile.user.role === 'tutor' ? 'tutor' : profile.role,
      tags: profile.profileTags.map((t) => t.tag.name),
      rating: profile.rating,
      reviewCount: profile.reviews.length,
      description: profile.description,
      pricePerHour: profile.priceFrom,
      averageGrade: profile.averageGrade,
      verified: moderation.tutorVerified || false,
      isOnline,
      banner,
      availability,
      recentReviews: normalizedRecentReviews,
    };
  }

  async listFavoriteTutorIds(userId: number) {
    const favorites = await this.prisma.$queryRaw<
      Array<{ tutorProfileId: number }>
    >`
      SELECT "tutorProfileId"
      FROM "FavoriteTutor"
      WHERE "studentUserId" = ${userId}
      ORDER BY "createdAt" DESC
    `;

    return favorites.map((favorite) => String(favorite.tutorProfileId));
  }

  async addFavoriteTutor(userId: number, tutorProfileId: number) {
    await this.ensureFavoriteEligibility(userId, tutorProfileId);

    await this.prisma.$executeRaw`
      INSERT INTO "FavoriteTutor" (
        "studentUserId",
        "tutorProfileId"
      )
      VALUES (
        ${userId},
        ${tutorProfileId}
      )
      ON CONFLICT ("studentUserId", "tutorProfileId")
      DO NOTHING
    `;

    return { success: true };
  }

  async removeFavoriteTutor(userId: number, tutorProfileId: number) {
    await this.prisma.$executeRaw`
      DELETE FROM "FavoriteTutor"
      WHERE
        "studentUserId" = ${userId}
        AND "tutorProfileId" = ${tutorProfileId}
    `;

    return { success: true };
  }

  private async ensureFavoriteEligibility(userId: number, tutorProfileId: number) {
    const [student, tutorProfile] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
        },
      }),
      this.prisma.profile.findUnique({
        where: { id: tutorProfileId },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      }),
    ]);

    if (!student) {
      throw new BadRequestException('Пользователь не найден');
    }

    if (student.role !== 'student') {
      throw new BadRequestException('Избранное доступно только студентам');
    }

    if (!tutorProfile) {
      throw new BadRequestException('Анкета не найдена');
    }

    if (tutorProfile.user.role !== 'tutor') {
      throw new BadRequestException('Сохранять можно только стутьюторов');
    }

    if (tutorProfile.user.id === userId) {
      throw new BadRequestException('Нельзя сохранить собственную анкету');
    }
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

  private normalizeAverageGrade(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalizedValue = String(value).trim().replace(',', '.');
    const parsedValue = Number(normalizedValue);

    if (Number.isNaN(parsedValue)) {
      throw new BadRequestException('Средний балл должен быть числом');
    }

    if (parsedValue < 0 || parsedValue > 5) {
      throw new BadRequestException('Средний балл должен быть в диапазоне от 0 до 5');
    }

    return Math.round(parsedValue * 100) / 100;
  }

  private normalizeName(value: unknown) {
    const normalized = String(value || '').trim();
    if (!normalized) {
      throw new BadRequestException('Имя обязательно');
    }
    if (normalized.length > PROFILE_NAME_MAX_LENGTH) {
      throw new BadRequestException('Имя слишком длинное');
    }
    return normalized;
  }

  private normalizeCourse(value: unknown) {
    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 6) {
      throw new BadRequestException('Курс должен быть числом от 1 до 6');
    }

    return parsedValue;
  }

  private normalizeDescription(value: unknown) {
    const normalized = String(value || '').trim();
    if (normalized.length > PROFILE_DESCRIPTION_MAX_LENGTH) {
      throw new BadRequestException('Описание слишком длинное');
    }
    return normalized;
  }

  private normalizeTags(value: unknown) {
    const source = Array.isArray(value) ? value : [];
    const normalized = source
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, TAG_MAX_COUNT)
      .map((item) => item.slice(0, TAG_MAX_LENGTH));

    return [...new Set(normalized)];
  }

  private normalizeAvailability(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    return {
      formats: Array.isArray(value.formats) ? value.formats.slice(0, 2) : [],
      primeDays: Array.isArray(value.primeDays) ? value.primeDays.slice(0, 7) : [],
      primeTime: String(value.primeTime || '').slice(0, AVAILABILITY_TIME_MAX_LENGTH),
      note: String(value.note || '').slice(0, AVAILABILITY_NOTE_MAX_LENGTH),
    };
  }
}
