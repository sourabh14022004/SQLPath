import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { LeetcodeCheckerService } from './leetcode-checker.service';
import { ScreenshotStoreService } from './screenshot-store.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [VerificationService, LeetcodeCheckerService, ScreenshotStoreService],
  exports: [VerificationService],
})
export class VerificationModule {}
