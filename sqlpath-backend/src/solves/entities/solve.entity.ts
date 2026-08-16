import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';
import { EvidenceTier, SolveStatus } from '../../common/enums';

@Entity('solves')
export class Solve {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'sql_code', type: 'text' })
  sqlCode: string;

  @Column({ name: 'screenshot_url', nullable: true, type: 'text' })
  screenshotUrl: string;

  @Column({ name: 'evidence_tier', default: EvidenceTier.CODE_ONLY })
  evidenceTier: EvidenceTier;

  @Index()
  @Column({ type: 'varchar', length: 20, default: SolveStatus.PENDING })
  status: SolveStatus;

  @Column({
    name: 'score_awarded',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  scoreAwarded: number;

  @Column({ name: 'first_opened_at', type: 'timestamptz' })
  firstOpenedAt: Date;

  @Index()
  @Column({
    name: 'submitted_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  submittedAt: Date;

  @Column({ name: 'time_on_task_sec' })
  timeOnTaskSec: number;

  @Column({ name: 'auto_check_result', nullable: true, type: 'jsonb' })
  autoCheckResult: object;

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}