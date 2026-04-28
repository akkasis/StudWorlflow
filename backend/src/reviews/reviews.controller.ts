import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() body: any) {
    return this.reviewsService.create(req.user.userId, body);
  }

  @Patch(':reviewId')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: any, @Param('reviewId') reviewId: string, @Body() body: any) {
    return this.reviewsService.update(req.user.userId, Number(reviewId), body);
  }

  @Get(':profileId')
  find(@Param('profileId') profileId: string) {
    return this.reviewsService.findByProfile(Number(profileId));
  }
}
