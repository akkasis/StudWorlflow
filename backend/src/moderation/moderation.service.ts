import { Global, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UserRole = 'student' | 'tutor' | 'moderator' | 'admin';

export interface BanState {
  permanent?: boolean;
  until?: string | null;
  reason?: string | null;
}

export interface UserModerationState {
  tutorVerified?: boolean;
  ban?: BanState | null;
}

export interface ReviewModerationState {
  verified?: boolean;
}

@Global()
@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getUserState(userId: number): Promise<UserModerationState> {
    const [state] = await this.prisma.$queryRaw<
      Array<{
        userId: number;
        tutorVerified: boolean;
        banPermanent: boolean;
        banUntil: Date | null;
        banReason: string | null;
      }>
    >`
      SELECT
        "userId",
        "tutorVerified",
        "banPermanent",
        "banUntil",
        "banReason"
      FROM "UserModerationState"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    if (!state) {
      return {};
    }

    const hasBan = state.banPermanent || state.banUntil || state.banReason;

    return {
      tutorVerified: state.tutorVerified,
      ban: hasBan
        ? {
            permanent: state.banPermanent || undefined,
            until: state.banUntil?.toISOString() || null,
            reason: state.banReason || null,
          }
        : null,
    };
  }

  async setUserState(userId: number, state: UserModerationState) {
    const tutorVerified = state.tutorVerified ?? false;
    const banPermanent = Boolean(state.ban?.permanent);
    const banUntil = state.ban?.until ? new Date(state.ban.until) : null;
    const banReason = state.ban?.reason || null;

    const [saved] = await this.prisma.$queryRaw<
      Array<{
        userId: number;
        tutorVerified: boolean;
        banPermanent: boolean;
        banUntil: Date | null;
        banReason: string | null;
      }>
    >`
      INSERT INTO "UserModerationState" (
        "userId",
        "tutorVerified",
        "banPermanent",
        "banUntil",
        "banReason"
      )
      VALUES (
        ${userId},
        ${tutorVerified},
        ${banPermanent},
        ${banUntil},
        ${banReason}
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "tutorVerified" = EXCLUDED."tutorVerified",
        "banPermanent" = EXCLUDED."banPermanent",
        "banUntil" = EXCLUDED."banUntil",
        "banReason" = EXCLUDED."banReason"
      RETURNING
        "userId",
        "tutorVerified",
        "banPermanent",
        "banUntil",
        "banReason"
    `;

    return {
      tutorVerified: saved.tutorVerified,
      ban:
        saved.banPermanent || saved.banUntil || saved.banReason
          ? {
              permanent: saved.banPermanent || undefined,
              until: saved.banUntil?.toISOString() || null,
              reason: saved.banReason || null,
            }
          : null,
    };
  }

  async getReviewState(reviewId: number): Promise<ReviewModerationState> {
    const [state] = await this.prisma.$queryRaw<
      Array<{
        reviewId: number;
        verified: boolean;
      }>
    >`
      SELECT
        "reviewId",
        "verified"
      FROM "ReviewModerationState"
      WHERE "reviewId" = ${reviewId}
      LIMIT 1
    `;

    if (!state) {
      return {};
    }

    return {
      verified: state.verified,
    };
  }

  async setReviewState(reviewId: number, state: ReviewModerationState) {
    const [saved] = await this.prisma.$queryRaw<
      Array<{
        reviewId: number;
        verified: boolean;
      }>
    >`
      INSERT INTO "ReviewModerationState" (
        "reviewId",
        "verified"
      )
      VALUES (
        ${reviewId},
        ${state.verified ?? false}
      )
      ON CONFLICT ("reviewId")
      DO UPDATE SET
        "verified" = EXCLUDED."verified"
      RETURNING
        "reviewId",
        "verified"
    `;

    return {
      verified: saved.verified,
    };
  }

  async isUserBanned(userId: number) {
    const [state] = await this.prisma.$queryRaw<
      Array<{
        banPermanent: boolean;
        banUntil: Date | null;
      }>
    >`
      SELECT
        "banPermanent",
        "banUntil"
      FROM "UserModerationState"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    if (!state) {
      return false;
    }

    if (state.banPermanent) {
      return true;
    }

    if (state.banUntil) {
      return state.banUntil.getTime() > Date.now();
    }

    return false;
  }

  async getBanReason(userId: number) {
    const [state] = await this.prisma.$queryRaw<
      Array<{
        banReason: string | null;
      }>
    >`
      SELECT
        "banReason"
      FROM "UserModerationState"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    return state?.banReason || null;
  }
}
