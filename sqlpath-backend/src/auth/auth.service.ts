import {
  Injectable, ConflictException, UnauthorizedException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: {
    name: string;
    email: string;
    password: string;
    cohortCode?: string;
    role?: Role;
  }) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    let cohortId: string | null = null;
    if (dto.cohortCode) {
      const result = await this.userRepository.query(
        `SELECT id FROM cohorts WHERE enroll_code = $1 LIMIT 1`,
        [dto.cohortCode],
      );
      if (result.length === 0)
        throw new BadRequestException('Invalid cohort code');
      cohortId = result[0].id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? Role.STUDENT,
      cohortId,
    });

    const saved = await this.userRepository.save(user);
    return this.buildTokenResponse(saved);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid email or password');

    return this.buildTokenResponse(user);
  }

  async setLeetcodeUsername(userId: string, leetcodeUsername: string) {
    const token = `SQLPATH-${userId.slice(0, 8).toUpperCase()}`;
    const verified = await this.checkLeetcodeBio(leetcodeUsername, token);

    if (!verified) {
      throw new BadRequestException(
        `Please add "${token}" to your LeetCode bio first, then try again.`,
      );
    }

    await this.userRepository.update(userId, {
      leetcodeUsername,
      leetcodeVerified: true,
    });

    return {
      message: 'LeetCode username verified and saved',
      leetcodeUsername,
      verificationToken: token,
    };
  }

  private buildTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cohortId: user.cohortId,
        trustScore: user.trustScore,
        leetcodeVerified: user.leetcodeVerified,
      },
    };
  }

  private async checkLeetcodeBio(
    username: string,
    token: string,
  ): Promise<boolean> {
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            profile { aboutMe }
          }
        }
      `;
      const response = await fetch(
        this.configService.get<string>('LEETCODE_GRAPHQL_URL'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { username } }),
        },
      );
      const data = await response.json() as any;
      const bio: string = data?.data?.matchedUser?.profile?.aboutMe ?? '';
      return bio.includes(token);
    } catch (err) {
      this.logger.error('LeetCode bio check failed', err);
      return false;
    }
  }
}