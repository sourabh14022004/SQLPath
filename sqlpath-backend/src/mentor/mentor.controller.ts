import {
  Controller, Get, Patch, Param, Body, Request, UseGuards,
} from '@nestjs/common';
import { MentorService } from './mentor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('mentor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MENTOR, Role.ADMIN)
export class MentorController {
  constructor(private mentorService: MentorService) {}

  @Get('queue')
  getQueue(@Request() req) {
    return this.mentorService.getQueue(req.user.id);
  }

  @Patch('queue/:id')
  decide(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { decision: 'approved' | 'rejected' | 'escalated'; note?: string },
  ) {
    return this.mentorService.decide(id, req.user.id, body.decision, body.note);
  }

  @Get('cohort-risk')
  getCohortRisk(@Request() req) {
    return this.mentorService.getCohortRisk(req.user.id);
  }

  @Get('student/:id')
  getStudentDetail(@Param('id') id: string) {
    return this.mentorService.getStudentDetail(id);
  }
}
