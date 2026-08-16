import {
  Controller, Get, Param, Post,
  Query, Request, UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  findAll(
    @Query('phase') phase?: string,
    @Query('difficulty') difficulty?: string,
    @Query('platform') platform?: string,
  ) {
    return this.questionsService.findAll({
      phase: phase ? Number(phase) : undefined,
      difficulty,
      platform,
    });
  }

  @Get('next')
  getNext(@Request() req) {
    return this.questionsService.getNextQuestion(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post(':id/open')
  open(@Param('id') id: string, @Request() req) {
    return this.questionsService.openQuestion(req.user.id, id);
  }
}