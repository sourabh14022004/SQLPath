import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LeetCodeCheckResult {
  verified: boolean;
  timestamp?: number;
  raw?: any;
  error?: string;
}

@Injectable()
export class LeetcodeCheckerService {
  private readonly logger = new Logger(LeetcodeCheckerService.name);

  constructor(private configService: ConfigService) {}

  async checkSolve(
    leetcodeUsername: string,
    questionSlug: string,
    firstOpenedAt: Date,
  ): Promise<LeetCodeCheckResult> {
    try {
      const submissions = await this.fetchRecentAccepted(leetcodeUsername);

      if (!submissions) {
        return { verified: false, error: 'api_unavailable' };
      }

      const firstOpenedTimestamp = Math.floor(firstOpenedAt.getTime() / 1000);

      const match = submissions.find(
        (s) =>
          s.titleSlug === questionSlug &&
          Number(s.timestamp) >= firstOpenedTimestamp,
      );

      if (match) {
        this.logger.log(
          `✅ Auto-verified: ${leetcodeUsername} solved ${questionSlug}`,
        );
        return { verified: true, timestamp: Number(match.timestamp), raw: submissions };
      }

      this.logger.log(`❌ Not found: ${questionSlug} not in recent submissions`);
      return { verified: false, raw: submissions };
    } catch (err) {
      this.logger.error('LeetCode check error', err);
      return { verified: false, error: 'exception', raw: String(err) };
    }
  }

  private async fetchRecentAccepted(username: string): Promise<any[] | null> {
    const limit = this.configService.get<number>('LEETCODE_RECENT_LIMIT', 20);
    const url = this.configService.get<string>(
      'LEETCODE_GRAPHQL_URL',
      'https://leetcode.com/graphql',
    );

    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          titleSlug
          timestamp
          lang
        }
      }
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SQLPath-Verification/1.0',
        },
        body: JSON.stringify({ query, variables: { username, limit } }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        this.logger.warn(`LeetCode API returned ${response.status}`);
        return null;
      }

      const data = await response.json() as any;

      if (data.errors) {
        this.logger.warn('LeetCode GraphQL errors', data.errors);
        return null;
      }

      return data?.data?.recentAcSubmissionList ?? null;
    } catch (err) {
      this.logger.error('LeetCode fetch failed', err);
      return null;
    }
  }
}
