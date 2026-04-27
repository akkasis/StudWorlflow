import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private profilesService: ProfilesService, // 🔥 добавили
  ) {}

  async register(data: any) {
    const { email, password, role, profile } = data;

    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // 🔥 СОЗДАЕМ ПРОФИЛЬ С РОЛЬЮ
    await this.profilesService.create(user.id, {
      ...profile,
      role, // 💣 ВОТ ЭТО ТЫ РАНЬШЕ НЕ ДЕЛАЛ
    });

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
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

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: token,
    };
  }
}