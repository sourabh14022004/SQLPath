import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeetcodeCheckerService } from './leetcode-checker.service';
import { ScreenshotStoreService } from './screenshot-store.service';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import {
  Platform, EvidenceTier, SolveStatus,
  SAMPLING_RATES, LOW_TRUST_THRESHOLD,
} from '../common/enums';

export interface VerificationResult {
  evidenceTier: EvidenceTier;
  status: SolveStatus;
  screenshotUrl: string | null;
  autoCheckResult: object | null;
  routeToQueue: boolean;
  queuePriority: number;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private leetcodeChecker: LeetcodeCheckerService,
    private screenshotStore: ScreenshotStoreService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async verify(
    student: User,
    question: Question,
    file: Express.Multer.File | undefined,
    firstOpenedAt: Date,
  ): Promise<VerificationResult> {
    if (question.platform === Platform.LEETCODE) {
      return this.handleLeetCode(student, question, firstOpenedAt);
    }
    return this.handleManual(student, question, file);
  }

  private async handleLeetCode(
    student: User,
    question: Question,
    firstOpenedAt: Date,
  ): Promise<VerificationResult> {
    if (!student.leetcodeVerified || !student.leetcodeUsername) {
      this.logger.warn(`Student ${student.id} has no verified LeetCode username`);
      return {
        evidenceTier: EvidenceTier.CODE_ONLY,
        status: SolveStatus.PENDING_REVIEW,
        screenshotUrl: null,
        autoCheckResult: { error: 'no_leetcode_username' },
        routeToQueue: true,
        queuePriority: 1,
      };
    }

    if (!question.leetcodeSlug) {
      this.logger.warn(`Question ${question.id} has no leetcode_slug set`);
      return {
        evidenceTier: EvidenceTier.CODE_ONLY,
        status: SolveStatus.PENDING_REVIEW,
        screenshotUrl: null,
        autoCheckResult: { error: 'no_slug_configured' },
        routeToQueue: true,
        queuePriority: 3,
      };
    }

    const result = await this.leetcodeChecker.checkSolve(
      student.leetcodeUsername,
      question.leetcodeSlug,
      firstOpenedAt,
    );

    if (result.verified) {
      const spotCheck = Math.random() < SAMPLING_RATES.TIER_3;
      return {
        evidenceTier: EvidenceTier.AUTO_VERIFIED,
        status: spotCheck ? SolveStatus.PENDING_REVIEW : SolveStatus.AUTO_VERIFIED,
        screenshotUrl: null,
        autoCheckResult: result.raw,
        routeToQueue: spotCheck,
        queuePriority: 10,
      };
    }

    return {
      evidenceTier: EvidenceTier.CODE_ONLY,
      status: SolveStatus.PENDING,
      screenshotUrl: null,
      autoCheckResult: { ...result, retryable: !result.error },
      routeToQueue: false,
      queuePriority: 5,
    };
  }

  private async handleManual(
    student: User,
    question: Question,
    file: Express.Multer.File | undefined,
  ): Promise<VerificationResult> {
    if (!file) {
      return {
        evidenceTier: EvidenceTier.CODE_ONLY,
        status: SolveStatus.PENDING_REVIEW,
        screenshotUrl: null,
        autoCheckResult: null,
        routeToQueue: true,
        queuePriority: this.getQueuePriority(student.trustScore, EvidenceTier.CODE_ONLY),
      };
    }

    const screenshotUrl = await this.screenshotStore.upload(
      file, student.id, question.id,
    );

    const routeToQueue = this.shouldSample(
      student.trustScore, EvidenceTier.CODE_SCREENSHOT,
    );

    return {
      evidenceTier: EvidenceTier.CODE_SCREENSHOT,
      status: routeToQueue ? SolveStatus.PENDING_REVIEW : SolveStatus.AUTO_VERIFIED,
      screenshotUrl,
      autoCheckResult: null,
      routeToQueue,
      queuePriority: this.getQueuePriority(
        student.trustScore, EvidenceTier.CODE_SCREENSHOT,
      ),
    };
  }

  private shouldSample(trustScore: number, tier: EvidenceTier): boolean {
    if (trustScore < LOW_TRUST_THRESHOLD) return true;
    switch (tier) {
      case EvidenceTier.CODE_ONLY:       return Math.random() < SAMPLING_RATES.TIER_1;
      case EvidenceTier.CODE_SCREENSHOT: return Math.random() < SAMPLING_RATES.TIER_2;
      case EvidenceTier.AUTO_VERIFIED:   return Math.random() < SAMPLING_RATES.TIER_3;
      default: return false;
    }
  }

  private getQueuePriority(trustScore: number, tier: EvidenceTier): number {
    if (trustScore < LOW_TRUST_THRESHOLD) return 1;
    if (tier === EvidenceTier.CODE_ONLY) return 3;
    if (tier === EvidenceTier.CODE_SCREENSHOT) return 5;
    return 10;
  }
}
