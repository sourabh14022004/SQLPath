import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('usernames')
  getUsernames(@Request() req) {
    return this.profilesService.getPlatformUsernames(req.user.id);
  }

  @Patch('codeforces')
  saveCodeforces(@Request() req, @Body() body: { codeforcesUsername: string | null }) {
    return this.profilesService.saveCodeforcesUsername(req.user.id, body.codeforcesUsername);
  }

  @Patch('geeksforgeeks')
  saveGeeksforgeeks(@Request() req, @Body() body: { geeksforgeeksUsername: string | null }) {
    return this.profilesService.saveGeeksforgeeksUsername(req.user.id, body.geeksforgeeksUsername);
  }

  @Patch('hackerrank')
  saveHackerrank(@Request() req, @Body() body: { hackerrankUsername: string | null }) {
    return this.profilesService.saveHackerrankUsername(req.user.id, body.hackerrankUsername);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.profilesService.getAllStats(req.user.id);
  }
}
