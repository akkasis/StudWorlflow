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
        name: data.name,
        university: data.university,
        course: data.course,
        description: data.description,
        priceFrom: data.priceFrom,
        profileTags: {
          create: data.tags?.map((tag: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },
      },
      include: {
        profileTags: {
          include: { tag: true },
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
        course: data.course,
        description: data.description,
        priceFrom: data.priceFrom,
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
      include: {
        profileTags: {
          include: { tag: true },
        },
      },
    });
  }

  async findAll(query: any) {
    const {
      priceFrom,
      priceTo,
      rating,
      tag,
      sortBy,
      order,
    } = query;

    return this.prisma.profile.findMany({
      where: {
        priceFrom: priceFrom
          ? { gte: Number(priceFrom) }
          : undefined,

        ...(priceTo && {
          priceFrom: { lte: Number(priceTo) },
        }),

        rating: rating
          ? { gte: Number(rating) }
          : undefined,

        profileTags: tag
          ? {
              some: {
                tag: {
                  name: tag,
                },
              },
            }
          : undefined,
      },

      orderBy: sortBy
        ? {
            [sortBy]: order === 'asc' ? 'asc' : 'desc',
          }
        : undefined,

      include: {
        profileTags: {
          include: { tag: true },
        },
      },
    });
  }
}