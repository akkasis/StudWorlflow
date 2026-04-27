import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TutorAvailability {
  formats: string[];
  primeDays: string[];
  primeTime: string;
  note: string;
}

@Injectable()
export class ProfileMetaService {
  constructor(private prisma: PrismaService) {}

  async getAvailability(profileId: number): Promise<TutorAvailability | null> {
    const [profile] = await this.prisma.$queryRaw<
      Array<{
        availabilityFormats: string[];
        availabilityDays: string[];
        availabilityTime: string | null;
        availabilityNote: string | null;
      }>
    >`
      SELECT
        "availabilityFormats",
        "availabilityDays",
        "availabilityTime",
        "availabilityNote"
      FROM "Profile"
      WHERE "id" = ${profileId}
      LIMIT 1
    `;

    if (!profile) {
      return null;
    }

    const normalized: TutorAvailability = {
      formats: profile.availabilityFormats || [],
      primeDays: profile.availabilityDays || [],
      primeTime: profile.availabilityTime || '',
      note: profile.availabilityNote || '',
    };

    const hasContent =
      normalized.formats.length > 0 ||
      normalized.primeDays.length > 0 ||
      Boolean(normalized.primeTime) ||
      Boolean(normalized.note);

    return hasContent ? normalized : null;
  }

  async setAvailability(
    profileId: number,
    availability?: Partial<TutorAvailability>,
  ) {
    if (!availability) {
      await this.prisma.$executeRaw`
        UPDATE "Profile"
        SET
          "availabilityFormats" = ARRAY[]::TEXT[],
          "availabilityDays" = ARRAY[]::TEXT[],
          "availabilityTime" = NULL,
          "availabilityNote" = NULL
        WHERE "id" = ${profileId}
      `;
      return null;
    }

    const normalized: TutorAvailability = {
      formats: availability.formats || [],
      primeDays: availability.primeDays || [],
      primeTime: availability.primeTime?.trim() || '',
      note: availability.note?.trim() || '',
    };

    const hasContent =
      normalized.formats.length > 0 ||
      normalized.primeDays.length > 0 ||
      Boolean(normalized.primeTime) ||
      Boolean(normalized.note);

    if (!hasContent) {
      await this.prisma.$executeRaw`
        UPDATE "Profile"
        SET
          "availabilityFormats" = ARRAY[]::TEXT[],
          "availabilityDays" = ARRAY[]::TEXT[],
          "availabilityTime" = NULL,
          "availabilityNote" = NULL
        WHERE "id" = ${profileId}
      `;
      return null;
    }

    await this.prisma.$executeRaw`
      UPDATE "Profile"
      SET
        "availabilityFormats" = ARRAY[${Prisma.join(normalized.formats)}]::TEXT[],
        "availabilityDays" = ARRAY[${Prisma.join(normalized.primeDays)}]::TEXT[],
        "availabilityTime" = ${normalized.primeTime || null},
        "availabilityNote" = ${normalized.note || null}
      WHERE "id" = ${profileId}
    `;

    return normalized;
  }

  async getBanner(profileId: number): Promise<string | null> {
    const [profile] = await this.prisma.$queryRaw<
      Array<{
        bannerUrl: string | null;
      }>
    >`
      SELECT
        "bannerUrl"
      FROM "Profile"
      WHERE "id" = ${profileId}
      LIMIT 1
    `;

    return profile?.bannerUrl || null;
  }

  async setBanner(profileId: number, banner?: string | null) {
    const normalized = banner?.trim() || null;

    await this.prisma.$executeRaw`
      UPDATE "Profile"
      SET "bannerUrl" = ${normalized}
      WHERE "id" = ${profileId}
    `;

    return normalized;
  }
}
