import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface TutorAvailability {
  formats: string[];
  primeDays: string[];
  primeTime: string;
  note: string;
}

interface ProfileMetaStore {
  availability: Record<string, TutorAvailability>;
  banners: Record<string, string>;
}

@Injectable()
export class ProfileMetaService {
  private readonly storePath = join(process.cwd(), 'data', 'profile-meta.json');

  async getAvailability(profileId: number): Promise<TutorAvailability | null> {
    const store = await this.readStore();
    return store.availability[String(profileId)] || null;
  }

  async setAvailability(profileId: number, availability?: Partial<TutorAvailability>) {
    const store = await this.readStore();

    if (!availability) {
      delete store.availability[String(profileId)];
      await this.writeStore(store);
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
      delete store.availability[String(profileId)];
      await this.writeStore(store);
      return null;
    }

    store.availability[String(profileId)] = normalized;
    await this.writeStore(store);
    return normalized;
  }

  async getBanner(profileId: number): Promise<string | null> {
    const store = await this.readStore();
    return store.banners[String(profileId)] || null;
  }

  async setBanner(profileId: number, banner?: string | null) {
    const store = await this.readStore();
    const normalized = banner?.trim();

    if (!normalized) {
      delete store.banners[String(profileId)];
      await this.writeStore(store);
      return null;
    }

    store.banners[String(profileId)] = normalized;
    await this.writeStore(store);
    return normalized;
  }

  private async readStore(): Promise<ProfileMetaStore> {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });

    try {
      const raw = await fs.readFile(this.storePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ProfileMetaStore>;
      return {
        availability: parsed.availability || {},
        banners: parsed.banners || {},
      };
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const emptyStore: ProfileMetaStore = {
          availability: {},
          banners: {},
        };
        await this.writeStore(emptyStore);
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ProfileMetaStore) {
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2), 'utf8');
  }
}
