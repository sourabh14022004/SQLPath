import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('engagement')
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(private engagementService: EngagementService) {}

  @Get('me')
  getMe(@Request() req) {
    return this.engagementService.getMyEngagement(req.user.id);
  }
}
