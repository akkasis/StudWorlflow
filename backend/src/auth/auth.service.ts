import {
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from '../profiles/profiles.service';
import { ModerationService } from '../moderation/moderation.service';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_PASSWORD } from './auth.constants';
import { MailService } from '../mail/mail.service';
import { appConfig } from '../config/app.config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private profilesService: ProfilesService,
    private moderationService: ModerationService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.prisma.user.findUnique({
      where: { email: ROOT_ADMIN_EMAIL },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(ROOT_ADMIN_PASSWORD, 10);

      await this.prisma.user.create({
        data: {
          email: ROOT_ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
        },
      });
    }

    await this.prisma.$executeRaw`
      UPDATE "User"
      SET "emailVerified" = true
      WHERE "email" = ${ROOT_ADMIN_EMAIL}
    `;
  }

  async register(data: any) {
    const {
      email,
      password,
      role = 'student',
      profile,
      name,
      course,
      description,
      tags,
      pricePerHour,
    } = data;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email обязателен');
    }

    const userExists = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role === 'tutor' ? 'tutor' : 'student';

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: normalizedRole,
        },
      });

      await tx.profile.create({
        data: {
          userId: createdUser.id,
          role: normalizedRole,
          name: profile?.name || name || '',
          university: 'РАНХиГС',
          course: Number(profile?.course || course || 1),
          description:
            normalizedRole === 'tutor'
              ? profile?.description || description || ''
              : '',
          priceFrom:
            normalizedRole === 'tutor'
              ? Number(profile?.pricePerHour || pricePerHour || 0)
              : 0,
          profileTags:
            normalizedRole === 'tutor'
              ? {
                  create: (profile?.tags || tags || []).map((tag: string) => ({
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

      return createdUser;
    });

    await this.createAndSendVerificationToken(user.id, normalizedEmail);

    return {
      success: true,
      requiresEmailVerification: true,
      message:
        'Аккаунт создан. Мы отправили письмо для подтверждения почты.',
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const emailState = await this.getEmailVerificationState(user.id);
    if (
      !emailState.emailVerified &&
      user.role !== 'admin' &&
      user.role !== 'moderator'
    ) {
      throw new BadRequestException(
        'Подтверди почту, прежде чем войти в аккаунт',
      );
    }

    if (await this.moderationService.isUserBanned(user.id)) {
      throw new BadRequestException('Account is banned');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const emailState = await this.getEmailVerificationState(user.id);

    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
      emailVerified: emailState.emailVerified,
    };
  }

  async verifyEmail(token: string) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      throw new BadRequestException('Некорректный токен подтверждения');
    }

    const [record] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        userId: number;
        token: string;
        expiresAt: Date;
      }>
    >`
      SELECT
        "id",
        "userId",
        "token",
        "expiresAt"
      FROM "EmailVerificationToken"
      WHERE "token" = ${normalizedToken}
      LIMIT 1
    `;

    if (!record) {
      throw new BadRequestException('Ссылка подтверждения недействительна');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.$executeRaw`
        DELETE FROM "EmailVerificationToken"
        WHERE "userId" = ${record.userId}
      `;
      throw new BadRequestException('Срок действия ссылки истек');
    }

    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE "User"
        SET "emailVerified" = true
        WHERE "id" = ${record.userId}
      `,
      this.prisma.$executeRaw`
        DELETE FROM "EmailVerificationToken"
        WHERE "userId" = ${record.userId}
      `,
    ]);

    return {
      success: true,
      message: 'Почта успешно подтверждена. Теперь можно войти.',
    };
  }

  async resendVerificationEmail(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email обязателен');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: true,
        message:
          'Если такой аккаунт существует, письмо с подтверждением отправлено.',
      };
    }

    const emailState = await this.getEmailVerificationState(user.id);
    if (emailState.emailVerified) {
      return {
        success: true,
        message: 'Эта почта уже подтверждена.',
      };
    }

    await this.createAndSendVerificationToken(user.id, user.email);

    return {
      success: true,
      message: 'Мы отправили новое письмо для подтверждения почты.',
    };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email обязателен');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: true,
        message:
          'Если такой аккаунт существует, письмо для сброса пароля уже отправлено.',
      };
    }

    await this.prisma.$executeRaw`
      DELETE FROM "PasswordResetToken"
      WHERE "userId" = ${user.id}
    `;

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await this.prisma.$executeRaw`
      INSERT INTO "PasswordResetToken" (
        "id",
        "userId",
        "token",
        "expiresAt"
      )
      VALUES (
        ${randomUUID()},
        ${user.id},
        ${token},
        ${expiresAt}
      )
    `;

    const resetUrl = `${appConfig.appBaseUrl}/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);

    return {
      success: true,
      message:
        'Если такой аккаунт существует, письмо для сброса пароля уже отправлено.',
    };
  }

  async resetPassword(token: string, password: string) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      throw new BadRequestException('Некорректный токен сброса');
    }

    if (!password || String(password).trim().length < 6) {
      throw new BadRequestException('Пароль должен быть не короче 6 символов');
    }

    const [record] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        userId: number;
        token: string;
        expiresAt: Date;
      }>
    >`
      SELECT
        "id",
        "userId",
        "token",
        "expiresAt"
      FROM "PasswordResetToken"
      WHERE "token" = ${normalizedToken}
      LIMIT 1
    `;

    if (!record) {
      throw new BadRequestException('Ссылка для сброса пароля недействительна');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.$executeRaw`
        DELETE FROM "PasswordResetToken"
        WHERE "userId" = ${record.userId}
      `;
      throw new BadRequestException('Срок действия ссылки истек');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          password: hashedPassword,
        },
      }),
      this.prisma.$executeRaw`
        DELETE FROM "PasswordResetToken"
        WHERE "userId" = ${record.userId}
      `,
    ]);

    return {
      success: true,
      message: 'Пароль обновлен. Теперь можно войти с новым паролем.',
    };
  }

  private async createAndSendVerificationToken(userId: number, email: string) {
    await this.prisma.$executeRaw`
      DELETE FROM "EmailVerificationToken"
      WHERE "userId" = ${userId}
    `;

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.$executeRaw`
      INSERT INTO "EmailVerificationToken" (
        "id",
        "userId",
        "token",
        "expiresAt"
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        ${token},
        ${expiresAt}
      )
    `;

    const verificationUrl = `${appConfig.appBaseUrl}/verify-email?token=${token}`;
    await this.mailService.sendVerificationEmail(email, verificationUrl);
  }

  private async getEmailVerificationState(userId: number) {
    const [state] = await this.prisma.$queryRaw<
      Array<{
        emailVerified: boolean;
      }>
    >`
      SELECT
        "emailVerified"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    return {
      emailVerified: state?.emailVerified || false,
    };
  }
}
