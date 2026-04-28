import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { appConfig } from '../config/app.config';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client | null;

  constructor() {
    if (
      appConfig.s3Endpoint &&
      appConfig.s3Region &&
      appConfig.s3Bucket &&
      appConfig.s3AccessKeyId &&
      appConfig.s3SecretAccessKey
    ) {
      this.s3Client = new S3Client({
        region: appConfig.s3Region,
        endpoint: appConfig.s3Endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: appConfig.s3AccessKeyId,
          secretAccessKey: appConfig.s3SecretAccessKey,
        },
      });
      return;
    }

    this.s3Client = null;
  }

  ensureConfigured() {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'S3 storage is not configured',
      );
    }
  }

  async uploadProfileImage(
    file: UploadedImageFile,
    kind: 'avatar' | 'banner',
    userId: number,
  ) {
    this.ensureConfigured();
    this.validateImage(file);

    const extension = this.getExtension(file);
    const key = `${kind}s/user-${userId}-${randomUUID()}.${extension}`;

    try {
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: appConfig.s3Bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Не удалось загрузить файл в хранилище',
      );
    }

    return {
      key,
      url: this.buildPublicUrl(key),
    };
  }

  private validateImage(file?: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException('Файл не найден');
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Поддерживаются только JPG, PNG, WEBP и GIF',
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Размер файла не должен превышать 5 MB');
    }
  }

  private buildPublicUrl(key: string) {
    if (appConfig.s3PublicBaseUrl) {
      return `${appConfig.s3PublicBaseUrl}/${key}`;
    }

    return `${appConfig.s3Endpoint}/${appConfig.s3Bucket}/${key}`;
  }

  private getExtension(file: UploadedImageFile) {
    const originalExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (originalExtension && originalExtension.length <= 5) {
      return originalExtension;
    }

    switch (file.mimetype) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'jpg';
    }
  }
}
