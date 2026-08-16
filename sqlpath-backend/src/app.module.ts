import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { SolvesModule } from './solves/solves.module';
import { QuestionsModule } from './questions/questions.module';
import { VerificationModule } from './verification/verification.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EngagementModule } from './engagement/engagement.module';
import { MentorModule } from './mentor/mentor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    QuestionsModule,
    SolvesModule,
    VerificationModule,
    LeaderboardModule,
    EngagementModule,
    MentorModule,
  ],
})
export class AppModule {}