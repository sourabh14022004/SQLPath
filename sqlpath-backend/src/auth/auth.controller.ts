import {
  Controller, Post, Patch, Body,
  Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: {
      name: string;
      email: string;
      password: string;
      cohortCode?: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Patch('leetcode-username')
  @UseGuards(JwtAuthGuard)
  setLeetcodeUsername(
    @Request() req,
    @Body() body: { leetcodeUsername: string },
  ) {
    return this.authService.setLeetcodeUsername(
      req.user.id,
      body.leetcodeUsername,
    );
  }
}