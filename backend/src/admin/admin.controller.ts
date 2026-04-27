import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private ensureModerator(req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  private ensureAdmin(req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Get('overview')
  getOverview(@Req() req: any) {
    this.ensureModerator(req);
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers(@Req() req: any) {
    this.ensureModerator(req);
    return this.adminService.listUsers();
  }

  @Get('users/:userId/context')
  getUserContext(@Req() req: any, @Param('userId') userId: string) {
    this.ensureModerator(req);
    return this.adminService.getUserContext(Number(userId));
  }

  @Patch('users/:userId')
  updateUser(@Req() req: any, @Param('userId') userId: string, @Body() body: any) {
    this.ensureModerator(req);
    return this.adminService.updateUser(req.user.email, Number(userId), body);
  }

  @Delete('users/:userId')
  deleteUser(@Req() req: any, @Param('userId') userId: string) {
    this.ensureAdmin(req);
    return this.adminService.deleteUser(
      Number(req.user.userId),
      req.user.role,
      Number(userId),
    );
  }

  @Get('reviews')
  listReviews(@Req() req: any) {
    this.ensureModerator(req);
    return this.adminService.listReviews();
  }

  @Patch('reviews/:reviewId')
  updateReview(
    @Req() req: any,
    @Param('reviewId') reviewId: string,
    @Body() body: any,
  ) {
    this.ensureModerator(req);
    return this.adminService.updateReview(Number(reviewId), body);
  }

  @Delete('reviews/:reviewId')
  deleteReview(@Req() req: any, @Param('reviewId') reviewId: string) {
    this.ensureModerator(req);
    return this.adminService.deleteReview(Number(reviewId));
  }

  @Patch('profiles/:profileId')
  updateProfile(
    @Req() req: any,
    @Param('profileId') profileId: string,
    @Body() body: any,
  ) {
    this.ensureModerator(req);
    return this.adminService.updateProfile(Number(profileId), body);
  }
}
