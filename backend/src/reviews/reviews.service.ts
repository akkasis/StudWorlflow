import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: any) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const [author, profile] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      this.prisma.profile.findUnique({
        where: { id: data.profileId },
        select: { id: true, userId: true, role: true },
      }),
    ]);

    if (!author) {
      throw new BadRequestException('User not found');
    }

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    if (author.role !== 'student') {
      throw new BadRequestException('Only students can leave reviews');
    }

    if (profile.role !== 'tutor') {
      throw new BadRequestException('Reviews can only be left for tutors');
    }

    if (profile.userId === userId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        profileId: data.profileId,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already left a review for this tutor',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        rating: data.rating,
        text: data.text,
        userId,
        profileId: data.profileId,
      },
    });

    // 🔥 пересчёт рейтинга
    const reviews = await this.prisma.review.findMany({
      where: { profileId: data.profileId },
    });

    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.profile.update({
      where: { id: data.profileId },
      data: { rating: avg },
    });

    return review;
  }

  async findByProfile(profileId: number) {
    return this.prisma.review.findMany({
      where: { profileId },
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
    });
  }
}
