import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolvesController } from './solves.controller';
import { SolvesService } from './solves.service';
import { Solve } from './entities/solve.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solve, User, Question]),
    VerificationModule,
  ],
  controllers: [SolvesController],
  providers: [SolvesService],
  exports: [SolvesService],
})
export class SolvesModule {}