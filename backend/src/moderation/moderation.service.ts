import { Global, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

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

interface ModerationStore {
  users: Record<string, UserModerationState>;
  reviews: Record<string, ReviewModerationState>;
}

@Global()
@Injectable()
export class ModerationService {
  private readonly storePath = join(process.cwd(), 'data', 'moderation.json');

  async getUserState(userId: number) {
    const store = await this.readStore();
    return store.users[String(userId)] || {};
  }

  async setUserState(userId: number, state: UserModerationState) {
    const store = await this.readStore();
    store.users[String(userId)] = {
      ...(store.users[String(userId)] || {}),
      ...state,
    };
    await this.writeStore(store);
    return store.users[String(userId)];
  }

  async getReviewState(reviewId: number) {
    const store = await this.readStore();
    return store.reviews[String(reviewId)] || {};
  }

  async setReviewState(reviewId: number, state: ReviewModerationState) {
    const store = await this.readStore();
    store.reviews[String(reviewId)] = {
      ...(store.reviews[String(reviewId)] || {}),
      ...state,
    };
    await this.writeStore(store);
    return store.reviews[String(reviewId)];
  }

  async isUserBanned(userId: number) {
    const state = await this.getUserState(userId);
    const ban = state.ban;

    if (!ban) {
      return false;
    }

    if (ban.permanent) {
      return true;
    }

    if (ban.until) {
      return new Date(ban.until).getTime() > Date.now();
    }

    return false;
  }

  async getBanReason(userId: number) {
    const state = await this.getUserState(userId);
    return state.ban?.reason || null;
  }

  private async readStore(): Promise<ModerationStore> {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });

    try {
      const raw = await fs.readFile(this.storePath, 'utf8');
      return JSON.parse(raw) as ModerationStore;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const emptyStore: ModerationStore = {
          users: {},
          reviews: {},
        };
        await this.writeStore(emptyStore);
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ModerationStore) {
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2), 'utf8');
  }
}
