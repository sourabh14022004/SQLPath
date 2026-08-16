import {
  Controller, Post, Get, Body, Request,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SolvesService } from './solves.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('solves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolvesController {
  constructor(private solvesService: SolvesService) {}

  @Post()
  @Roles(Role.STUDENT)
  @UseInterceptors(
    FileInterceptor('screenshot', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  submitSolve(
    @Request() req,
    @Body() body: { questionId: string; sqlCode: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.solvesService.submitSolve(
      req.user.id, body.questionId, body.sqlCode, file,
    );
  }

  @Get('my')
  @Roles(Role.STUDENT)
  getMySolves(@Request() req) {
    return this.solvesService.getMySolves(req.user.id);
  }
}