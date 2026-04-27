import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from '../profiles/profiles.service';
import { ModerationService } from '../moderation/moderation.service';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_PASSWORD } from './auth.constants';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private profilesService: ProfilesService,
    private moderationService: ModerationService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.prisma.user.findUnique({
      where: { email: ROOT_ADMIN_EMAIL },
    });

    if (adminExists) {
      return;
    }

    const hashedPassword = await bcrypt.hash(ROOT_ADMIN_PASSWORD, 10);

    await this.prisma.user.create({
      data: {
        email: ROOT_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
      },
    });
  }

  async register(data: any) {
    const {
      email,
      password,
      role = 'student',
      profile,
      name,
      university,
      course,
      description,
      tags,
      pricePerHour,
    } = data;

    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedRole = role === 'tutor' ? 'tutor' : 'student';

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: normalizedRole,
      },
    });

    await this.profilesService.create(user.id, {
      ...(profile || {}),
      role: normalizedRole,
      name: profile?.name || name,
      university: profile?.university || university,
      course: profile?.course || course,
      description: profile?.description || description,
      tags: profile?.tags || tags,
      pricePerHour: profile?.pricePerHour || pricePerHour,
    });

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
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

    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
    };
  }
}
