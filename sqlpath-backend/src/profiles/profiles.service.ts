import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface LeetCodeStats {
  username: string;
  ranking: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  badges: { displayName: string; icon: string }[];
  activeBadge: { displayName: string; icon: string } | null;
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contribution: number;
}

export interface GfgStats {
  username: string;
  totalSolved: number;
  codingScore: number;
  instituteRank: string | null;
  currentStreak: string;
  school: number;
  basic: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface HackerrankStats {
  username: string;
  totalBadges: number;
  totalStars: number;
  badges: { name: string; stars: number }[];
}

function extractHandle(input: string | null | undefined): string | null {
  if (!input) return null;
  let h = input.trim();
  h = h.replace(/\/+$/, '');
  if (h.includes('/')) {
    const parts = h.split('/');
    h = parts[parts.length - 1] || h;
  }
  h = h.replace(/^@+/, '');
  return h || null;
}

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPlatformUsernames(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return {
      leetcode: extractHandle(user?.leetcodeUsername),
      leetcodeVerified: user?.leetcodeVerified ?? false,
      codeforces: extractHandle(user?.codeforcesUsername),
      geeksforgeeks: extractHandle(user?.geeksforgeeksUsername),
      hackerrank: extractHandle(user?.hackerrankUsername),
    };
  }

  async saveCodeforcesUsername(userId: string, handle: string | null) {
    const clean = extractHandle(handle);
    await this.userRepository.update(userId, { codeforcesUsername: clean } as any);
    return { message: 'Codeforces username saved', codeforcesUsername: clean };
  }

  async saveGeeksforgeeksUsername(userId: string, handle: string | null) {
    const clean = extractHandle(handle);
    await this.userRepository.update(userId, { geeksforgeeksUsername: clean } as any);
    return { message: 'GeeksforGeeks username saved', geeksforgeeksUsername: clean };
  }

  async saveHackerrankUsername(userId: string, handle: string | null) {
    const clean = extractHandle(handle);
    await this.userRepository.update(userId, { hackerrankUsername: clean } as any);
    return { message: 'HackerRank username saved', hackerrankUsername: clean };
  }

  async getLeetcodeStats(username: string): Promise<LeetCodeStats | null> {
    const clean = extractHandle(username);
    if (!clean) return null;
    try {
      const query = `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile { ranking }
            submitStatsGlobal { acSubmissionNum { difficulty count } }
            badges { displayName icon }
            activeBadge { displayName icon }
          }
        }
      `;
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'SQLPath/1.0', 'Referer': 'https://leetcode.com' },
        body: JSON.stringify({ query, variables: { username: clean } }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json() as any;
      const u = data?.data?.matchedUser;
      if (!u) return null;
      const acNums: { difficulty: string; count: number }[] = u.submitStatsGlobal?.acSubmissionNum ?? [];
      const get = (d: string) => acNums.find(x => x.difficulty === d)?.count ?? 0;
      return {
        username: u.username,
        ranking: u.profile?.ranking ?? 0,
        easySolved: get('Easy'),
        mediumSolved: get('Medium'),
        hardSolved: get('Hard'),
        totalSolved: get('All'),
        badges: u.badges ?? [],
        activeBadge: u.activeBadge ?? null,
      };
    } catch (err) {
      this.logger.error('LeetCode stats fetch failed', err);
      return null;
    }
  }

  async getCodeforcesStats(handle: string): Promise<CodeforcesStats | null> {
    const clean = extractHandle(handle);
    if (!clean) return null;
    try {
      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(clean)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      const data = await res.json() as any;
      if (data.status !== 'OK' || !data.result?.[0]) return null;
      const u = data.result[0];
      return {
        handle: u.handle,
        rating: u.rating ?? 0,
        maxRating: u.maxRating ?? 0,
        rank: u.rank ?? 'unrated',
        maxRank: u.maxRank ?? 'unrated',
        contribution: u.contribution ?? 0,
      };
    } catch (err) {
      this.logger.error('Codeforces stats fetch failed', err);
      return null;
    }
  }

  async getGfgStats(username: string): Promise<GfgStats | null> {
    const clean = extractHandle(username);
    if (!clean) return null;
    try {
      const res = await fetch(
        `https://geeks-for-geeks-stats-api.vercel.app/?userName=${encodeURIComponent(clean)}`,
        { signal: AbortSignal.timeout(10000) },
      );
      const data = await res.json() as any;
      if (!data?.info) return null;
      return {
        username: data.info.userName ?? clean,
        totalSolved: data.info.totalProblemsSolved ?? 0,
        codingScore: data.info.codingScore ?? 0,
        instituteRank: data.info.instituteRank ?? null,
        currentStreak: String(data.info.currentStreak ?? '0'),
        school: data.solvedStats?.school?.count ?? 0,
        basic: data.solvedStats?.basic?.count ?? 0,
        easy: data.solvedStats?.easy?.count ?? 0,
        medium: data.solvedStats?.medium?.count ?? 0,
        hard: data.solvedStats?.hard?.count ?? 0,
      };
    } catch (err) {
      this.logger.error('GFG stats fetch failed', err);
      return null;
    }
  }

  async getHackerrankStats(username: string): Promise<HackerrankStats | null> {
    const clean = extractHandle(username);
    if (!clean) return null;
    try {
      const res = await fetch(
        `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(clean)}/badges`,
        { headers: { 'User-Agent': 'SQLPath/1.0' }, signal: AbortSignal.timeout(8000) },
      );
      const data = await res.json() as any;
      if (!data?.models) return null;
      const badges = (data.models as any[]).map(m => ({
        name: m.badge?.name ?? 'Unknown',
        stars: m.stars ?? 0,
      }));
      return {
        username: clean,
        totalBadges: badges.length,
        totalStars: badges.reduce((s, b) => s + b.stars, 0),
        badges,
      };
    } catch (err) {
      this.logger.error('HackerRank stats fetch failed', err);
      return null;
    }
  }

  async getAllStats(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { leetcode: null, codeforces: null, geeksforgeeks: null, hackerrank: null };

    const [leetcode, codeforces, geeksforgeeks, hackerrank] = await Promise.all([
      user.leetcodeUsername ? this.getLeetcodeStats(user.leetcodeUsername) : null,
      user.codeforcesUsername ? this.getCodeforcesStats(user.codeforcesUsername) : null,
      user.geeksforgeeksUsername ? this.getGfgStats(user.geeksforgeeksUsername) : null,
      user.hackerrankUsername ? this.getHackerrankStats(user.hackerrankUsername) : null,
    ]);

    return { leetcode, codeforces, geeksforgeeks, hackerrank };
  }
}
