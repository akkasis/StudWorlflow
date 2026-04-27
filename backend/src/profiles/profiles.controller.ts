import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

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

  @Get()
  findAll(@Query() query: any) {
    return this.profilesService.findAll(query);
  }
}