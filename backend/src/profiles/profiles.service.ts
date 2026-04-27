import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: any) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    return this.prisma.profile.create({
      data: {
        userId,
        role: data.role || 'student', // 🔥 КЛЮЧЕВОЙ ФИКС

        name: data.name,
        university: data.university || '',
        course: Number(data.course || 1),
        description: data.description || '',
        priceFrom: Number(data.pricePerHour || 0),

        profileTags: {
          create: (data.tags || []).map((tag: string) => ({
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
    return this.prisma.profile.update({
      where: { userId },
      data: {
        name: data.name,
        university: data.university,
        course: data.course ? Number(data.course) : undefined,
        description: data.description,
        priceFrom: data.pricePerHour
          ? Number(data.pricePerHour)
          : undefined,

        profileTags: data.tags
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
  }

  async findAll(query: any) {
    const profiles = await this.prisma.profile.findMany({
      where: {
        role: 'tutor', // 🔥 ТОЛЬКО ТЬЮТОРЫ В МАРКЕТПЛЕЙСЕ
      },
      include: {
        profileTags: {
          include: {
            tag: true,
          },
        },
        reviews: true,
      },
    });

    return profiles.map((p) => ({
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
    }));
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        profileTags: {
          include: {
            tag: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    return {
      id: String(profile.id),
      name: profile.name,
      avatar: profile.avatarUrl,
      university: profile.university,
      course: String(profile.course),
      tags: profile.profileTags.map((t) => t.tag.name),
      rating: profile.rating,
      reviewCount: profile.reviews.length,
      description: profile.description,
      pricePerHour: profile.priceFrom,
      reviews: profile.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        userEmail: review.user.email,
      })),
    };
  }

  async findByUserId(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        profileTags: {
          include: {
            tag: true,
          },
        },
        reviews: true,
      },
    });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    return {
      id: String(profile.id),
      name: profile.name,
      avatar: profile.avatarUrl,
      university: profile.university,
      course: String(profile.course),
      role: profile.role, // ✅ уже ок
      tags: profile.profileTags.map((t) => t.tag.name),
      rating: profile.rating,
      reviewCount: profile.reviews.length,
      description: profile.description,
      pricePerHour: profile.priceFrom,
    };
  }
}