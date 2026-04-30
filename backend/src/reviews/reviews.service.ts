import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REVIEW_TEXT_MAX_LENGTH = 1500;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  private async recalculateProfileRating(profileId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { profileId },
      select: { rating: true },
    });

    const avg = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { rating: avg },
    });
  }

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
        text: this.normalizeText(data.text),
        userId,
        profileId: data.profileId,
      },
    });

    await this.recalculateProfileRating(data.profileId);

    return review;
  }

  async update(userId: number, reviewId: number, data: any) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: { role: true },
        },
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can edit only your own review');
    }

    if (review.user.role !== 'student') {
      throw new BadRequestException('Only students can edit reviews');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        text: this.normalizeText(data.text),
      },
    });

    await this.recalculateProfileRating(review.profileId);

    return updatedReview;
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

  private normalizeText(value: unknown) {
    const normalized = String(value || '').trim();

    if (!normalized) {
      throw new BadRequestException('Текст отзыва не может быть пустым');
    }

    if (normalized.length > REVIEW_TEXT_MAX_LENGTH) {
      throw new BadRequestException('Отзыв слишком длинный');
    }

    return normalized;
  }
}
