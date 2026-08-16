import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('alltime')
  getAllTime() {
    return this.leaderboardService.getAllTime();
  }

  @Get('weekly')
  getWeekly() {
    return this.leaderboardService.getWeekly();
  }

  @Get('cohort')
  getCohort(@Request() req) {
    return this.leaderboardService.getCohort(req.user.cohortId);
  }
}
