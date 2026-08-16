import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { SolvesService } from '../solves/solves.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private solvesService: SolvesService,
  ) {}

  findAll(filters?: { phase?: number; difficulty?: string; platform?: string }) {
    const query = this.questionRepository
      .createQueryBuilder('q')
      .where('q.is_active = true')
      .orderBy('q.number', 'ASC');

    if (filters?.phase)
      query.andWhere('q.phase = :phase', { phase: filters.phase });
    if (filters?.difficulty)
      query.andWhere('q.difficulty = :d', { d: filters.difficulty });
    if (filters?.platform)
      query.andWhere('q.platform = :p', { p: filters.platform });

    return query.getMany();
  }

  async findOne(id: string) {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async openQuestion(studentId: string, questionId: string) {
    const question = await this.findOne(questionId);
    const { firstOpenedAt } = await this.solvesService.recordOpen(
      studentId,
      questionId,
    );
    return { question, firstOpenedAt };
  }

  async getNextQuestion(studentId: string) {
    const result = await this.questionRepository
      .createQueryBuilder('q')
      .leftJoin(
        'solves',
        's',
        `s.question_id = q.id AND s.student_id = :sid
         AND s.status NOT IN (:...bad)`,
        { sid: studentId, bad: ['rejected', 'pending'] },
      )
      .where('q.is_active = true')
      .andWhere('s.id IS NULL')
      .orderBy('q.number', 'ASC')
      .getOne();

    return result ?? null;
  }
}