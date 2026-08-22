// Defaults to a relative path so requests go through Next's rewrite
// (see next.config.ts), which forwards /api/v1/* to the backend
// server-to-server — same-origin from the browser's point of view, no
// CORS involved. Set NEXT_PUBLIC_API_URL to an absolute URL only if you
// want the frontend to call a backend that ISN'T behind this app's
// rewrite (e.g. the old two-service deploy, or a different environment).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

// The backend's global exception filter wraps errors as
// { statusCode, timestamp, path, message }, where `message` is itself
// either a plain string or a Nest validation payload like
// { statusCode, error, message: string | string[] }. Unwrap all of that
// down to a single displayable string.
function extractErrorMessage(data: any, fallback: string): string {
  let msg = data?.message ?? data;
  if (msg && typeof msg === 'object' && 'message' in msg) msg = msg.message;
  if (Array.isArray(msg)) msg = msg.join(', ');
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data, 'Request failed'));
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (body: { name: string; email: string; password: string; cohortCode: string }) =>
    request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getQuestions: (token: string, filters?: { phase?: number; difficulty?: string }) => {
    const params = new URLSearchParams();
    if (filters?.phase) params.set('phase', String(filters.phase));
    if (filters?.difficulty) params.set('difficulty', filters.difficulty);
    return request<any[]>(`/questions?${params}`, {}, token);
  },

  getNextQuestion: (token: string) =>
    request<any>('/questions/next', {}, token),

  openQuestion: (token: string, questionId: string) =>
    request<any>(`/questions/${questionId}/open`, { method: 'POST' }, token),

  submitSolve: async (token: string, questionId: string, sqlCode: string, screenshot?: File) => {
    const form = new FormData();
    form.append('questionId', questionId);
    form.append('sqlCode', sqlCode);
    if (screenshot) form.append('screenshot', screenshot);

    const res = await fetch(`${BASE_URL}/solves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractErrorMessage(data, 'Submit failed'));
    return data;
  },

  getMySolves: (token: string) =>
    request<any[]>('/solves/my', {}, token),

  getEngagement: (token: string) =>
    request<any>('/engagement/me', {}, token),

  getLeaderboard: (token: string, type: 'alltime' | 'weekly' | 'cohort') =>
    request<any[]>(`/leaderboard/${type}`, {}, token),

  getMentorQueue: (token: string) =>
    request<any[]>('/mentor/queue', {}, token),

  decideSolve: (token: string, queueId: string, decision: string, note?: string) =>
    request<any>(`/mentor/queue/${queueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, note }),
    }, token),

  getCohortRisk: (token: string) =>
    request<any[]>('/mentor/cohort-risk', {}, token),

  getStudentDetail: (token: string, studentId: string) =>
    request<any>(`/mentor/student/${studentId}`, {}, token),

  setLeetcodeUsername: (token: string, leetcodeUsername: string) =>
    request<any>('/auth/leetcode-username', {
      method: 'PATCH',
      body: JSON.stringify({ leetcodeUsername }),
    }, token),

  getPlatformUsernames: (token: string) =>
    request<{ leetcode: string | null; leetcodeVerified: boolean; codeforces: string | null; geeksforgeeks: string | null; hackerrank: string | null }>(
      '/profiles/usernames', {}, token,
    ),

  saveCodeforcesUsername: (token: string, codeforcesUsername: string | null) =>
    request<any>('/profiles/codeforces', {
      method: 'PATCH',
      body: JSON.stringify({ codeforcesUsername }),
    }, token),

  saveGeeksforgeeksUsername: (token: string, geeksforgeeksUsername: string | null) =>
    request<any>('/profiles/geeksforgeeks', {
      method: 'PATCH',
      body: JSON.stringify({ geeksforgeeksUsername }),
    }, token),

  saveHackerrankUsername: (token: string, hackerrankUsername: string | null) =>
    request<any>('/profiles/hackerrank', {
      method: 'PATCH',
      body: JSON.stringify({ hackerrankUsername }),
    }, token),

  getProfileStats: (token: string) =>
    request<{ leetcode: any | null; codeforces: any | null; geeksforgeeks: any | null; hackerrank: any | null }>(
      '/profiles/stats', {}, token,
    ),
};
