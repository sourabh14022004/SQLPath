export enum Platform {
  LEETCODE = 'leetcode',
  HACKERRANK = 'hackerrank',
  DATALEMUR = 'datalemur',
  STRATASCRATCH = 'stratascratch',
  SQLZOO = 'sqlzoo',
  GEEKSFORGEEKS = 'geeksforgeeks',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum EvidenceTier {
  CODE_ONLY = 1,
  CODE_SCREENSHOT = 2,
  AUTO_VERIFIED = 3,
  MENTOR_VERIFIED = 4,
}

export enum SolveStatus {
  PENDING = 'pending',
  AUTO_VERIFIED = 'auto_verified',
  PENDING_REVIEW = 'pending_review',
  MENTOR_VERIFIED = 'mentor_verified',
  REJECTED = 'rejected',
}

export enum Role {
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin',
}

export enum EngagementStatus {
  ACTIVE = 'active',
  SLIPPING = 'slipping',
  AT_RISK = 'at_risk',
  DORMANT = 'dormant',
  NEVER_STARTED = 'never_started',
}

export enum ScoreEventType {
  SOLVE_SUBMITTED = 'solve_submitted',
  TIER_UPGRADED = 'tier_upgraded',
  MENTOR_VERIFIED = 'mentor_verified',
  SOLVE_REJECTED = 'solve_rejected',
  STREAK_BONUS = 'streak_bonus',
  CONSISTENCY_BONUS = 'consistency_bonus',
  TRUST_PENALTY = 'trust_penalty',
}

export enum TrustEventType {
  SPEED_VIOLATION = 'speed_violation',
  BURST_DETECTED = 'burst_detected',
  DUPLICATE_SQL = 'duplicate_sql',
  MISSING_PROOF = 'missing_proof',
  MENTOR_APPROVED = 'mentor_approved',
  SOLVE_REJECTED = 'solve_rejected',
  CONSISTENT_ACTIVITY = 'consistent_activity',
  STREAK_MILESTONE = 'streak_milestone',
}

export enum FlagType {
  IMPOSSIBLE_SPEED = 'impossible_speed',
  SUBMISSION_BURST = 'submission_burst',
  DUPLICATE_SQL = 'duplicate_sql',
  MISSING_PROOF = 'missing_proof',
}

export enum QueueStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
}

export const DIFFICULTY_WEIGHTS = {
  [Difficulty.EASY]: 1.0,
  [Difficulty.MEDIUM]: 1.5,
  [Difficulty.HARD]: 2.0,
};

export const EVIDENCE_TIER_WEIGHTS = {
  [EvidenceTier.CODE_ONLY]: 0.3,
  [EvidenceTier.CODE_SCREENSHOT]: 0.7,
  [EvidenceTier.AUTO_VERIFIED]: 0.95,
  [EvidenceTier.MENTOR_VERIFIED]: 1.0,
};

export const BASE_POINTS = {
  [Difficulty.EASY]: 10,
  [Difficulty.MEDIUM]: 25,
  [Difficulty.HARD]: 50,
};

export const MIN_TIME_SECONDS = {
  [Difficulty.EASY]: 90,
  [Difficulty.MEDIUM]: 300,
  [Difficulty.HARD]: 720,
};

export const STREAK_BONUS_PER_DAY = 0.02;
export const STREAK_BONUS_MAX = 0.3;
export const CONSISTENCY_BONUS = 1.1;
export const CONSISTENCY_DAYS_REQUIRED = 5;
export const CONSISTENCY_WINDOW_DAYS = 7;

export const TRUST_DELTAS = {
  MENTOR_APPROVED: +2,
  SOLVE_REJECTED: -10,
  SPEED_VIOLATION: -5,
  BURST_DETECTED: -8,
  DUPLICATE_SQL: -15,
  CONSISTENT_ACTIVITY: +1,
  STREAK_MILESTONE: +3,
};

export const SAMPLING_RATES = {
  TIER_1: 1.0,
  TIER_2: 0.3,
  TIER_3: 0.1,
  LOW_TRUST: 1.0,
};

export const LOW_TRUST_THRESHOLD = 40;
export const BURST_WINDOW_MINUTES = 10;
export const BURST_MAX_SUBMISSIONS = 5;