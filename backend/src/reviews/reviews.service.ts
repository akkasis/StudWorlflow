import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: any) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
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
          select: {
            email: true,
          },
        },
      },
    });
  }
}