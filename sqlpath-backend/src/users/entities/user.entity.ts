import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Role, EngagementStatus } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: Role.STUDENT })
  role: Role;

  @Column({ name: 'cohort_id', nullable: true, type: 'uuid' })
  cohortId: string;

  @Column({ name: 'leetcode_username', nullable: true, length: 100 })
  leetcodeUsername: string;

  @Column({ name: 'leetcode_verified', default: false })
  leetcodeVerified: boolean;

  @Column({ name: 'codeforces_username', nullable: true, length: 100 })
  codeforcesUsername: string;

  @Column({ name: 'geeksforgeeks_username', nullable: true, length: 100 })
  geeksforgeeksUsername: string;

  @Column({ name: 'hackerrank_username', nullable: true, length: 100 })
  hackerrankUsername: string;

  @Column({ name: 'trust_score', default: 80 })
  trustScore: number;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_active_date', nullable: true, type: 'date' })
  lastActiveDate: string;

  @Column({
    name: 'engagement_status',
    type: 'varchar',
    length: 20,
    default: EngagementStatus.NEVER_STARTED,
  })
  engagementStatus: EngagementStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}