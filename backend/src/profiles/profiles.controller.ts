import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Query,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StorageService } from '../storage/storage.service';

@Controller('profiles')
export class ProfilesController {
  constructor(
    private profilesService: ProfilesService,
    private storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() body: any) {
    return this.profilesService.create(req.user.userId, body);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  update(@Req() req: any, @Body() body: any) {
    return this.profilesService.update(req.user.userId, body);
  }

  // 🔥 ВОТ ГЛАВНОЕ ДОБАВЛЕНИЕ
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.profilesService.findByUserId(req.user.userId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@Req() req: any) {
    return this.profilesService.listFavoriteTutorIds(req.user.userId);
  }

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Req() req: any, @UploadedFile() file: any) {
    return this.storageService.uploadProfileImage(file, 'avatar', req.user.userId);
  }

  @Post('upload/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(@Req() req: any, @UploadedFile() file: any) {
    return this.storageService.uploadProfileImage(file, 'banner', req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.profilesService.findAll(query);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  addFavorite(@Req() req: any, @Param('id') id: string) {
    return this.profilesService.addFavoriteTutor(req.user.userId, Number(id));
  }

  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  removeFavorite(@Req() req: any, @Param('id') id: string) {
    return this.profilesService.removeFavoriteTutor(req.user.userId, Number(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(Number(id));
  }
}
