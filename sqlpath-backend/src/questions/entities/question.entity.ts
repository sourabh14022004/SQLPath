import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';
import { Platform, Difficulty } from '../../common/enums';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  number: number;

  @Column({ length: 255 })
  title: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  platform: Platform;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 'leetcode_slug', nullable: true, length: 255 })
  leetcodeSlug: string;

  @Column({ length: 100 })
  topic: string;

  @Index()
  @Column({ type: 'varchar', length: 10 })
  difficulty: Difficulty;

  @Index()
  @Column()
  phase: number;

  @Column({ name: 'base_points' })
  basePoints: number;

  @Column({ name: 'difficulty_weight', type: 'numeric', precision: 3, scale: 1 })
  difficultyWeight: number;

  @Column({ name: 'estimated_minutes' })
  estimatedMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}