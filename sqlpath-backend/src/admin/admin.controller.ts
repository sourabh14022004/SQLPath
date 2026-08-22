import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService, CreateQuestionDto, UpdateQuestionDto } from './admin.service';
import { ProfilesService } from '../profiles/profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private profilesService: ProfilesService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('questions/heatmap')
  getQuestionHeatmap() {
    return this.adminService.getQuestionHeatmap();
  }

  @Post('questions')
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.adminService.createQuestion(dto);
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.adminService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.OK)
  deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(id);
  }

  @Delete('questions/:id/hard')
  @HttpCode(HttpStatus.OK)
  hardDeleteQuestion(@Param('id') id: string) {
    return this.adminService.hardDeleteQuestion(id);
  }

  @Get('students')
  getStudents() {
    return this.adminService.getStudents();
  }

  @Get('student/:id')
  getStudentDetail(@Param('id') id: string) {
    return this.adminService.getStudentDetail(id);
  }

  @Get('student/:id/platform-stats')
  getStudentPlatformStats(@Param('id') id: string) {
    return this.profilesService.getAllStats(id);
  }
}
