import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { ProfileMetaService } from './profile-meta.service';

const DEFAULT_UNIVERSITY = 'РАНХиГС';

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

        name: data.name || '',
        university: DEFAULT_UNIVERSITY,
        course: Number(data.course || 1),
        description: role === 'tutor' ? data.description || '' : '',
        priceFrom: role === 'tutor' ? Number(data.pricePerHour || 0) : 0,

        profileTags: {
          create: tags.map((tag: string) => ({
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
        name: data.name,
        university: DEFAULT_UNIVERSITY,
        course: data.course ? Number(data.course) : undefined,
        avatarUrl: data.avatar,
        description: isTutor ? data.description : undefined,
        priceFrom:
          isTutor && data.pricePerHour !== undefined
            ? Number(data.pricePerHour)
            : undefined,

        profileTags: isTutor && data.tags
          ? {
              deleteMany: {},
              create: data.tags.map((tag: string) => ({
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
        this.profileMetaService.setAvailability(profile.id, data.availability),
        this.profileMetaService.setBanner(profile.id, data.banner),
      ]);
    }

    return this.findByUserId(userId);
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
          role: normalizedRole,
          verified: moderation.tutorVerified || false,
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

    const reviews = await Promise.all(
      profile.reviews.map(async (review) => {
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
      verified: moderation.tutorVerified || false,
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
      verified: moderation.tutorVerified || false,
      banner,
      availability,
      recentReviews: normalizedRecentReviews,
    };
  }
}
