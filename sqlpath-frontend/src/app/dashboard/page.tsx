'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import { initials } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

function cleanHandle(input: string | null | undefined): string {
  if (!input) return '';
  let h = input.trim();
  h = h.replace(/\/+$/, '');
  if (h.includes('/')) {
    const parts = h.split('/');
    h = parts[parts.length - 1] || h;
  }
  h = h.replace(/^@+/, '');
  return h;
}

// ── SVG Smooth Sparklines (Spanning Full Width with Smooth Curves) ───────────
function SmoothSparkline({ color, type }: { color: string; type: 'streak' | 'points' | 'success' }) {
  let path = '';
  if (type === 'streak') {
    path = 'M 4 20 C 25 8, 45 22, 70 11 C 95 1, 115 17, 140 7 C 165 -3, 185 13, 210 2';
  } else if (type === 'points') {
    path = 'M 4 20 C 35 18, 70 15, 105 12 C 140 9, 175 5, 210 2';
  } else {
    path = 'M 4 21 C 35 13, 75 9, 115 7 C 155 5, 185 3, 210 2';
  }

  return (
    <div className="w-full h-7 flex items-end pt-1">
      <svg viewBox="0 0 214 24" preserveAspectRatio="none" className="w-full h-5 overflow-visible">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Platform Logos ────────────────────────────────────────────────────────────
function LeetCodeLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fill="#FFA116" d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831A5.792 5.792 0 0 0 13.483 0z" />
      <path fill="#5B5B5B" d="M5.009 13.564a1.38 1.38 0 0 1 1.378-1.38h11.226a1.38 1.38 0 0 1 0 2.76H6.387a1.38 1.38 0 0 1-1.378-1.38z" />
    </svg>
  );
}

function CodeforcesLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="1.5" y="9" width="5" height="13" rx="1.5" fill="#FFD400" />
      <rect x="9.5" y="3" width="5" height="19" rx="1.5" fill="#188BF6" />
      <rect x="17.5" y="14" width="5" height="8" rx="1.5" fill="#ED2128" />
    </svg>
  );
}

function GeeksForGeeksLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0F9D58">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5h-2v-9h2v9zm6 0h-2v-5.5a1.5 1.5 0 0 0-3 0v5.5h-2v-9h2v1.5a3.5 3.5 0 0 1 5 3.5v4z" />
    </svg>
  );
}

function HackerRankLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#2EC866">
      <rect width="24" height="24" rx="6" fill="#2EC866" />
      <path d="M7 6h2.5v4.5h5V6H17v12h-2.5v-4.8h-5V18H7V6z" fill="white" />
    </svg>
  );
}

// ── 3D Isometric Database Illustration with Sparkles (Warm Palette) ───────────
function IsometricDatabaseIllustration() {
  return (
    <div className="relative w-32 h-28 flex items-center justify-center select-none pointer-events-none shrink-0">
      <span className="absolute top-1 left-2 text-[#E3703C] text-sm font-bold animate-pulse">✦</span>
      <span className="absolute top-8 right-0 text-[#EFAE90] text-xs font-bold">✦</span>

      <svg viewBox="0 0 140 120" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="dbTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E3703C" />
            <stop offset="100%" stopColor="#EFAE90" />
          </linearGradient>
          <linearGradient id="dbBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C95826" />
            <stop offset="100%" stopColor="#261E18" />
          </linearGradient>
        </defs>

        {/* Top Cylinder */}
        <ellipse cx="65" cy="28" rx="36" ry="13" fill="url(#dbTopGrad)" />
        <path d="M29 28v18c0 7.18 16.12 13 36 13s36-5.82 36-13V28" fill="url(#dbBodyGrad)" />
        <ellipse cx="65" cy="46" rx="36" ry="13" fill="none" stroke="#FFE5D3" strokeWidth="1.5" />

        {/* Middle Cylinder */}
        <path d="M29 46v18c0 7.18 16.12 13 36 13s36-5.82 36-13V46" fill="url(#dbBodyGrad)" />
        <ellipse cx="65" cy="64" rx="36" ry="13" fill="none" stroke="#FFE5D3" strokeWidth="1.5" />

        {/* Bottom Cylinder */}
        <path d="M29 64v18c0 7.18 16.12 13 36 13s36-5.82 36-13V64" fill="url(#dbBodyGrad)" />

        {/* Code badge chip */}
        <rect x="56" y="54" width="44" height="28" rx="7" fill="#261E18" stroke="#E3703C" strokeWidth="2" />
        <text x="78" y="73" fill="#FFE5D3" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          &lt;/&gt;
        </text>
      </svg>
    </div>
  );
}

// ── Coding Profile Card Component ─────────────────────────────────────────────
function CodingProfileCard({
  name,
  username,
  accentColor,
  icon,
  topStat,
  topStatLabel,
  mainStat,
  mainStatLabel,
  breakdown,
}: {
  name: string;
  username: string;
  accentColor: string;
  icon: React.ReactNode;
  topStat?: string | number | React.ReactNode;
  topStatLabel?: string;
  mainStat: string | number;
  mainStatLabel: string;
  breakdown: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className="relative overflow-hidden bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-3.5 shadow-2xs transition-all hover:shadow-xs">
      <div className={`absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-r-full ${accentColor}`} />

      <div className="pl-2 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">{icon}</div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-[#261E18] block leading-tight truncate">{name}</span>
              <span className="text-xs text-[#8C877F] font-medium block truncate">@{username}</span>
            </div>
          </div>
          {topStat !== undefined && topStat !== null && (
            <div className="text-right shrink-0">
              <div className="text-sm font-extrabold text-[#261E18] leading-tight">{topStat}</div>
              {topStatLabel && <div className="text-[10px] font-medium text-[#8C877F]">{topStatLabel}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-[#D0CBC3]/40">
          <div className="shrink-0 text-left min-w-[48px]">
            <span className="text-sm font-extrabold text-[#261E18] block leading-tight">{mainStat}</span>
            <span className="text-[10px] font-medium text-[#8C877F] block">{mainStatLabel}</span>
          </div>

          <div className="h-6 w-px bg-[#D0CBC3]/60 shrink-0" />

          <div className="flex-1 flex items-center justify-around text-center">
            {breakdown.map((item, idx) => (
              <div key={idx}>
                <span className="text-[10px] font-medium text-[#8C877F] block">{item.label}</span>
                <span className={`text-xs font-bold block ${item.color || 'text-[#261E18]'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [engagement, setEngagement] = useState<any>(null);
  const [nextQ, setNextQ] = useState<any>(null);
  const [usernames, setUsernames] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [cohortRank, setCohortRank] = useState<number | null>(null);
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [mySolves, setMySolves] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }

    Promise.all([
      api.getEngagement(token).catch(() => null),
      api.getNextQuestion(token).catch(() => null),
      api.getPlatformUsernames(token).catch(() => ({ leetcode: null, leetcodeVerified: false, codeforces: null, geeksforgeeks: null, hackerrank: null })),
      api.getLeaderboard(token, 'cohort').catch(() => api.getLeaderboard(token, 'alltime')).catch(() => []),
      api.getMySolves(token).catch(() => []),
      api.getQuestions(token).catch(() => []),
    ]).then(([eng, next, unames, lboard, solves, qs]) => {
      setEngagement(eng);
      setNextQ(next);
      setUsernames(unames);
      setMySolves(Array.isArray(solves) ? solves : []);
      setQuestions(Array.isArray(qs) ? qs : []);

      if (Array.isArray(lboard)) {
        setLeaderboardList(lboard.slice(0, 4));
        const entry = lboard.find((l: any) => l.id === user?.id);
        if (entry?.rank) setCohortRank(Number(entry.rank));
      }

      const hasAny = Boolean(unames?.leetcode || unames?.codeforces || unames?.geeksforgeeks || unames?.hackerrank);
      if (hasAny) {
        api.getProfileStats(token).then(setStats).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [token, authLoading, user?.role, user?.id]);

  const trustScore = engagement?.trustScore ?? user?.trustScore ?? 92;
  const totalScore = Number(engagement?.totalScore ?? user?.score ?? 1240);
  const streak = engagement?.currentStreak ?? user?.currentStreak ?? 14;

  const verifiedSolvesCount = useMemo(() => {
    return mySolves.filter(s => s.status === 'mentor_verified' || s.status === 'auto_verified').length;
  }, [mySolves]);

  const totalCurriculumQuestions = questions.length || 350;
  const totalSolved = engagement?.totalSolved ?? (verifiedSolvesCount > 0 ? verifiedSolvesCount : (mySolves.length || 15));

  const phaseMeta = [
    { phase: 1, name: 'Phase 1: Basics & Filtering' },
    { phase: 2, name: 'Phase 2: String, Date & CASE' },
    { phase: 3, name: 'Phase 3: Aggregation & Grouping' },
    { phase: 4, name: 'Phase 4: Joins' },
    { phase: 5, name: 'Phase 5: Subqueries & Set Ops' },
    { phase: 6, name: 'Phase 6: Window Functions' },
    { phase: 7, name: 'Phase 7: CTEs & Recursion' },
    { phase: 8, name: 'Phase 8: Case Studies' },
  ];

  const solvedSet = useMemo(() => {
    const s = new Set<string>();
    mySolves.forEach((sv: any) => {
      if (sv.status === 'mentor_verified' || sv.status === 'auto_verified' || sv.status === 'pending') {
        s.add(sv.questionId);
      }
    });
    return s;
  }, [mySolves]);

  const phases = useMemo(() => {
    return phaseMeta.map(pm => {
      const qList = questions.filter(q => q.phase === pm.phase);
      const total = qList.length > 0 ? qList.length : (pm.phase <= 4 ? 50 : 30);
      const current = qList.filter(q => solvedSet.has(q.id)).length;
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      return { name: pm.name, current, total, pct };
    });
  }, [questions, solvedSet]);

  const overallSqlPct = totalCurriculumQuestions > 0 ? Math.round((verifiedSolvesCount / totalCurriculumQuestions) * 100) : 0;

  const recommendedQuestions = useMemo(() => {
    if (!questions || questions.length === 0) {
      return [
        { id: '1', title: 'Find Customer Referee', difficulty: 'Easy', topic: 'WHERE & NULL', phase: 1, basePoints: 10 },
        { id: '2', title: 'Customer Placing the Largest Number of Orders', difficulty: 'Medium', topic: 'GROUP BY', phase: 3, basePoints: 15 },
        { id: '3', title: 'Department Top Three Salaries', difficulty: 'Hard', topic: 'DENSE_RANK()', phase: 6, basePoints: 25 },
      ];
    }
    const unsolved = questions.filter(q => !solvedSet.has(q.id));
    return (unsolved.length > 0 ? unsolved : questions).slice(0, 3);
  }, [questions, solvedSet]);

  const heatmapMatrix = useMemo(() => {
    const dateCounts: Record<string, number> = {};
    mySolves.forEach(s => {
      if (s.createdAt) {
        const dStr = new Date(s.createdAt).toISOString().split('T')[0];
        dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
      }
    });

    const matrix: number[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayOfWeek = (today.getDay() + 6) % 7;
    const totalDays = 11 * 7 + (currentDayOfWeek + 1);

    for (let w = 0; w < 12; w++) {
      const weekCol: number[] = [];
      for (let r = 0; r < 7; r++) {
        const dayOffset = (11 - w) * 7 + (currentDayOfWeek - r);
        const dayDate = new Date(today.getTime() - dayOffset * 86400000);
        if (dayOffset < 0 || dayOffset > totalDays) {
          weekCol.push(0);
        } else {
          const dStr = dayDate.toISOString().split('T')[0];
          const count = dateCounts[dStr] || 0;
          weekCol.push(count);
        }
      }
      matrix.push(weekCol);
    }
    return matrix;
  }, [mySolves]);



  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'solves' | 'verifications' | 'platforms'>('all');

  const cleanLc = cleanHandle(usernames?.leetcode);
  const cleanCf = cleanHandle(usernames?.codeforces);
  const cleanGfg = cleanHandle(usernames?.geeksforgeeks);
  const cleanHr = cleanHandle(usernames?.hackerrank);
  const hasConnectedProfiles = Boolean(cleanLc || cleanCf || cleanGfg || cleanHr);

  const allPlatformActivities = useMemo(() => {
    const list: any[] = [];

    // 1. User solves & submissions on SQLPath
    mySolves.forEach((s: any) => {
      const qTitle = s.question?.title || `Question #${s.questionId?.slice(0, 4) || '1'}`;
      const isAuto = s.status === 'auto_verified';
      const isMentor = s.status === 'mentor_verified';
      const isVerified = isAuto || isMentor;
      const isPending = s.status === 'pending_review' || s.status === 'pending';

      const date = new Date(s.submittedAt || s.createdAt || Date.now());
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
      let timeStr = 'Just now';
      if (diffHours < 1) timeStr = 'Just now';
      else if (diffHours < 24) timeStr = `${diffHours}h ago`;
      else if (diffHours < 48) timeStr = 'Yesterday';
      else timeStr = `${Math.floor(diffHours / 24)} days ago`;

      let title = `Submitted ${qTitle}`;
      let type: 'solves' | 'verifications' = 'solves';

      if (isAuto) {
        title = `Auto-verified ${qTitle}`;
        type = 'verifications';
      } else if (isMentor) {
        title = `Mentor verified ${qTitle}`;
        type = 'verifications';
      }

      list.push({
        id: s.id,
        title,
        time: timeStr,
        rawDate: date.getTime(),
        pts: s.pointsAwarded ? `+${s.pointsAwarded} pts` : (isVerified ? '+15 pts' : 'Pending review'),
        status: s.status,
        type,
        difficulty: s.question?.difficulty || 'Medium',
        phase: s.question?.phase ? `Phase ${s.question.phase}` : undefined,
        verified: isVerified,
        pending: isPending,
      });
    });

    // 2. Connected external coding platforms
    if (cleanLc) {
      list.push({
        id: 'plat-lc',
        title: `Connected LeetCode (@${cleanLc})`,
        time: 'Live Sync Active',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.leetcode?.totalSolved ? `${stats.leetcode.totalSolved} solved` : 'Connected',
        type: 'platforms',
        verified: true,
      });
    }
    if (cleanCf) {
      list.push({
        id: 'plat-cf',
        title: `Connected Codeforces (@${cleanCf})`,
        time: 'Live Sync Active',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.codeforces?.rating ? `${stats.codeforces.rating} rating` : 'Connected',
        type: 'platforms',
        verified: true,
      });
    }
    if (cleanGfg) {
      list.push({
        id: 'plat-gfg',
        title: `Connected GeeksforGeeks (@${cleanGfg})`,
        time: 'Live Sync Active',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.geeksforgeeks?.totalSolved ? `${stats.geeksforgeeks.totalSolved} solved` : 'Connected',
        type: 'platforms',
        verified: true,
      });
    }
    if (cleanHr) {
      list.push({
        id: 'plat-hr',
        title: `Connected HackerRank (@${cleanHr})`,
        time: 'Live Sync Active',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.hackerrank?.totalBadges ? `${stats.hackerrank.totalBadges} badges` : 'Connected',
        type: 'platforms',
        verified: true,
      });
    }

    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [mySolves, cleanLc, cleanCf, cleanGfg, cleanHr, stats]);

  const recentActivityList = useMemo(() => {
    return allPlatformActivities.slice(0, 5);
  }, [allPlatformActivities]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return allPlatformActivities;
    return allPlatformActivities.filter(a => a.type === activityFilter);
  }, [allPlatformActivities, activityFilter]);

  if (loading || authLoading) {
    return (
      <StudentLayout>
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto bg-[#FBF6ED]">
          <Skeleton className="h-16 rounded-2xl" />
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-56 rounded-2xl" />
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            </div>
            <div className="w-full xl:w-[310px] space-y-5">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Sourabh';
  const featuredTitle = nextQ?.title || '#127 Employees Earning More Than Managers';
  const featuredPhase = nextQ?.phase ? `Phase ${nextQ.phase}: ${phaseMeta.find(p => p.phase === nextQ.phase)?.name.split(': ')[1] || 'SQL'}` : 'Phase 4: JOINS';
  const currentFeaturedPhaseSolved = phases.find(p => p.name.includes(`Phase ${nextQ?.phase || 4}`))?.current || 27;
  const currentFeaturedPhaseTotal = phases.find(p => p.name.includes(`Phase ${nextQ?.phase || 4}`))?.total || 60;

  return (
    <StudentLayout>
      <div className="h-full overflow-y-auto bg-[#FBF6ED]">
        <div className="pt-[20px] px-5 md:px-7 max-w-[1440px] mx-auto space-y-6 pb-16">

          {/* ── Top Header Greeting & Badges Bar (Matches Warm Palette) ── */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4"
          >
            {/* Left: Greeting & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-[#261E18] tracking-tight">
                Good morning, {firstName}! 👋
              </h1>
              <p className="text-xs font-medium text-[#554C44] mt-1">
                Focus on consistent progress. You're doing great!
              </p>
            </div>

            {/* Right: Status Badges and Interactive Profile Widget */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              {/* Day Streak */}
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div className="text-left leading-tight">
                  <span className="text-base font-extrabold text-[#261E18] block leading-none">{streak}</span>
                  <span className="text-[10px] font-medium text-[#8C877F] block mt-0.5">Day Streak</span>
                </div>
              </div>

              {/* Trust Score */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#2F8D46] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ✔
                </div>
                <div className="text-left leading-tight">
                  <span className="text-base font-extrabold text-[#261E18] block leading-none">{trustScore}</span>
                  <span className="text-[10px] font-medium text-[#8C877F] block mt-0.5">Trust Score</span>
                </div>
              </div>

              {/* Interactive User Profile Pill Button with Dropdown */}
              <div className="relative shrink-0" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#FFFBF5] border border-[#D0CBC3]/80 hover:border-[#E3703C]/60 hover:shadow-xs shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D0CBC3]/60 bg-gradient-to-br from-[#E3703C] to-[#EFAE90] text-[#FFFDF9] flex items-center justify-center text-xs font-extrabold shadow-inner select-none group-hover:scale-105 transition-transform">
                      {initials(user?.name)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#FFFBF5]" />
                  </div>

                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold text-[#261E18] block leading-tight truncate max-w-[110px]">
                      {user?.name || firstName}
                    </span>
                    <span className="text-[10px] font-medium text-[#8C877F] block -mt-0.5">
                      {user?.role === 'mentor' ? 'Mentor' : 'Student'}
                    </span>
                  </div>

                  <Icon
                    name="expand_more"
                    size={16}
                    className={`text-[#8C877F] group-hover:text-[#261E18] transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180 text-[#E3703C]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3] shadow-xl p-2 z-50 space-y-1"
                    >
                      {/* User Info Header */}
                      <div className="p-2.5 bg-[#FBF6ED] rounded-xl border border-[#D0CBC3]/40 space-y-0.5">
                        <p className="text-xs font-bold text-[#261E18] truncate leading-tight">
                          {user?.name || 'Arjun Sharma'}
                        </p>
                        <p className="text-[11px] text-[#8C877F] truncate">
                          {user?.email || 'student@sqlpath.com'}
                        </p>
                      </div>

                      {/* Menu Links */}
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#554C44] hover:bg-[#FFE5D3]/50 hover:text-[#E3703C] transition-colors"
                      >
                        <Icon name="link" size={16} />
                        <span>Coding Profiles</span>
                      </Link>

                      <Link
                        href="/progress"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#554C44] hover:bg-[#FFE5D3]/50 hover:text-[#E3703C] transition-colors"
                      >
                        <Icon name="assignment_turned_in" size={16} />
                        <span>My Progress</span>
                      </Link>

                      <Link
                        href="/activity"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#554C44] hover:bg-[#FFE5D3]/50 hover:text-[#E3703C] transition-colors"
                      >
                        <Icon name="schedule" size={16} />
                        <span>Activity History</span>
                      </Link>

                      <div className="h-px bg-[#D0CBC3]/50 my-1" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          router.replace('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Icon name="logout" size={16} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── Main Dashboard Layout (Flex with Compact Right Sidebar) ── */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">

            {/* ── Left Main Column (Takes all flexible space) ── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* 1. Featured "NEXT QUESTION" Card */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#E3703C] text-white flex items-center justify-center shadow-xs">
                          <Icon name="menu_book" size={16} filled />
                        </div>
                        <span className="text-[11px] font-extrabold text-[#E3703C] uppercase tracking-wider">
                          NEXT QUESTION
                        </span>
                      </div>
                      <span className="text-[#D0CBC3] text-lg font-bold">›</span>
                    </div>

                    {/* Title & Tags */}
                    <div>
                      <h2 className="text-[25px] font-extrabold text-[#261E18] tracking-tight leading-snug">
                        {featuredTitle}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#FFE5D3] text-[#E3703C] border border-[#EFAE90]/40">
                          {nextQ?.difficulty ? nextQ.difficulty.charAt(0).toUpperCase() + nextQ.difficulty.slice(1) : 'Medium'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#261E18] text-[#FFFDF9] uppercase">
                          {nextQ?.topic || 'JOIN'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium text-[#554C44] bg-[#FBF6ED] border border-[#D0CBC3]/70">
                          ⏱ 20 min
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#554C44] max-w-xl">
                      {nextQ?.description || 'Find all employees who earn more than their managers.'}
                    </p>

                    {/* Phase Progress Bar */}
                    <div className="pt-2 max-w-md">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#554C44] mb-1.5">
                        <span>{featuredPhase}</span>
                        <span className="text-[#8C877F]">{currentFeaturedPhaseSolved} / {currentFeaturedPhaseTotal}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#E3703C]"
                          style={{ width: `${currentFeaturedPhaseTotal > 0 ? Math.round((currentFeaturedPhaseSolved / currentFeaturedPhaseTotal) * 100) : 45}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right 3D Illustration & Action Button */}
                  <div className="flex flex-col items-end justify-between gap-4 shrink-0 self-stretch">
                    <IsometricDatabaseIllustration />

                    <Link
                      href={nextQ?.id ? `/roadmap/${nextQ.id}` : '/roadmap'}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E3703C] hover:bg-[#C95826] text-[#FFFDF9] text-xs font-bold shadow-md shadow-[#E3703C]/20 transition-all hover:shadow-lg"
                    >
                      <span>Solve Question</span>
                      <span className="text-sm font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* 2. 4 Stats Row */}
              <motion.div
                variants={staggerContainer(0.06)}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {/* Questions Solved */}
                <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                      <Icon name="menu_book" size={18} />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                        {totalSolved} <span className="text-xs font-normal text-[#8C877F]">/ {totalCurriculumQuestions}</span>
                      </span>
                      <span className="text-[11px] font-medium text-[#8C877F]">Questions Solved</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                    <div className="h-full rounded-full bg-[#E3703C]" style={{ width: `${Math.max(12, Math.min(100, Math.round((totalSolved / totalCurriculumQuestions) * 100)))}%` }} />
                  </div>
                </motion.div>

                {/* Current Streak */}
                <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                      <Icon name="local_fire_department" size={18} />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold text-[#261E18] block leading-tight">{streak}</span>
                      <span className="text-[11px] font-medium text-[#8C877F]">Current Streak</span>
                    </div>
                  </div>
                  <SmoothSparkline color="#E3703C" type="streak" />
                </motion.div>

                {/* Total Points */}
                <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF1E9] text-[#EFAE90] flex items-center justify-center">
                      <Icon name="emoji_events" size={18} />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                        {Math.round(totalScore).toLocaleString()}
                      </span>
                      <span className="text-[11px] font-medium text-[#8C877F]">Total Points</span>
                    </div>
                  </div>
                  <SmoothSparkline color="#EFAE90" type="points" />
                </motion.div>

                {/* Success Rate */}
                <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EAF7EE] text-[#2F8D46] flex items-center justify-center">
                      <Icon name="check_circle" size={18} />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                        {mySolves.length > 0 ? `${Math.round((verifiedSolvesCount / mySolves.length) * 100)}%` : '85%'}
                      </span>
                      <span className="text-[11px] font-medium text-[#8C877F]">Success Rate</span>
                    </div>
                  </div>
                  <SmoothSparkline color="#2F8D46" type="success" />
                </motion.div>
              </motion.div>

              {/* 3. 3 Middle Columns Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* SQLPath Progress */}
                <div className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#261E18]">SQLPath Progress</h3>
                    <button className="text-xs font-semibold text-[#554C44] hover:text-[#261E18] flex items-center gap-1 bg-[#FBF6ED] px-2 py-1 rounded-lg border border-[#D0CBC3]/70">
                      <span>Overall</span>
                      <Icon name="expand_more" size={14} />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#554C44] mb-1.5">
                      <span>Overall Completion</span>
                      <span className="text-[#261E18]">{overallSqlPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                      <div className="h-full rounded-full bg-[#E3703C]" style={{ width: `${Math.max(5, overallSqlPct)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 text-[11px]">
                    {phases.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <span className="text-[#554C44] font-medium truncate flex-1">{p.name}</span>
                        <span className="text-[#8C877F] font-mono shrink-0">{p.current}/{p.total}</span>
                        <div className="w-16 h-1 rounded-full bg-[#E5DFD7] shrink-0 overflow-hidden">
                          <div className="h-full rounded-full bg-[#E3703C]" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-[#554C44] font-semibold w-8 text-right shrink-0">{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Heatmap */}
                <div className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#261E18]">Activity Heatmap (12 Weeks)</h3>

                    <div className="flex gap-2 pt-4">
                      <div className="flex flex-col justify-between text-[10px] text-[#8C877F] font-medium py-0.5">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>

                      <div className="grid grid-flow-col grid-rows-7 gap-[3.5px] flex-1">
                        {heatmapMatrix.map((col, cIdx) =>
                          col.map((val, rIdx) => {
                            let bg = 'bg-[#E5DFD7]/60';
                            if (val === 1) bg = 'bg-[#FFE5D3]';
                            else if (val === 2) bg = 'bg-[#EFAE90]';
                            else if (val === 3) bg = 'bg-[#E3703C]';
                            else if (val >= 4) bg = 'bg-[#C95826]';

                            return (
                              <div
                                key={`${cIdx}-${rIdx}`}
                                className={`w-full h-3 rounded-[2.5px] ${bg} hover:scale-125 transition-transform cursor-pointer`}
                                title={`${val} solves`}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8C877F] font-medium pt-3 px-6">
                      <span>10 weeks ago</span>
                      <span>This week</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-[#8C877F] justify-start pt-2 border-t border-[#D0CBC3]/40">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#E5DFD7]" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#FFE5D3]" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#EFAE90]" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#E3703C]" />
                    <span>More</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#261E18]">Recent Activity</h3>

                    <div className="space-y-3 pt-2">
                      {recentActivityList.length > 0 ? (
                        recentActivityList.map((act, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] mt-0.5 shrink-0 font-bold ${
                                act.verified ? 'bg-[#EAF7EE] text-[#2F8D46]' : 'bg-[#FFE5D3] text-[#E3703C]'
                              }`}>
                                {act.verified ? '✔' : '⏳'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#261E18] truncate leading-tight">{act.title}</p>
                                <p className="text-[10px] text-[#8C877F] mt-0.5">{act.time}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#2F8D46] shrink-0">{act.pts}</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#8C877F]">
                          No recent solves yet. Solve a problem to see your activity!
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActivityModalOpen(true)}
                    className="text-xs font-bold text-[#E3703C] hover:underline block pt-2 border-t border-[#D0CBC3]/40 text-left cursor-pointer"
                  >
                    View all activity →
                  </button>
                </div>
              </div>

              {/* 4. Bottom Row: Recommended Practice & Cohort Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Recommended Practice Problems (7 cols) */}
                <div className="lg:col-span-7 bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                        <Icon name="psychology" size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#261E18]">Recommended Practice</h3>
                        <p className="text-[11px] text-[#8C877F]">Curated next problems for your active curriculum</p>
                      </div>
                    </div>
                    <Link
                      href="/roadmap"
                      className="text-xs font-bold text-[#E3703C] hover:underline flex items-center gap-1"
                    >
                      <span>Roadmap</span>
                      <span className="text-sm">→</span>
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {recommendedQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FBF6ED]/60 border border-[#D0CBC3]/50 hover:border-[#E3703C]/40 hover:bg-[#FFFDF9] transition-all"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-[#261E18] truncate">
                            {q.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE5D3] text-[#E3703C]">
                              {q.difficulty || 'Medium'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#261E18] text-[#FFFDF9] uppercase">
                              {q.topic || 'SQL'}
                            </span>
                            <span className="text-[10px] text-[#8C877F]">
                              Phase {q.phase || 1}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-[#2F8D46]">
                            +{q.basePoints || 15} pts
                          </span>
                          <Link
                            href={`/roadmap/${q.id}`}
                            className="px-3 py-1.5 rounded-lg bg-[#E3703C] hover:bg-[#C95826] text-[#FFFDF9] text-xs font-bold transition-colors shadow-2xs"
                          >
                            Solve →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cohort Leaderboard Widget (5 cols) */}
                <div className="lg:col-span-5 bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF1E9] text-[#EFAE90] flex items-center justify-center">
                          <Icon name="emoji_events" size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#261E18]">Cohort Top Solvers</h3>
                          <p className="text-[11px] text-[#8C877F]">Live cohort rankings</p>
                        </div>
                      </div>
                      <Link
                        href="/leaderboard"
                        className="text-xs font-bold text-[#E3703C] hover:underline flex items-center gap-1"
                      >
                        <span>Full Standings</span>
                        <span className="text-sm">→</span>
                      </Link>
                    </div>

                    <div className="space-y-2 pt-3">
                      {leaderboardList.length > 0 ? (
                        leaderboardList.map((entry, idx) => {
                          const isCurrentUser = entry.id === user?.id || entry.name === user?.name;
                          let rankBadge = `${idx + 1}`;
                          if (idx === 0) rankBadge = '🥇 #1';
                          else if (idx === 1) rankBadge = '🥈 #2';
                          else if (idx === 2) rankBadge = '🥉 #3';
                          else rankBadge = `#${idx + 1}`;

                          return (
                            <div
                              key={entry.id || idx}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                                isCurrentUser
                                  ? 'bg-[#FFE5D3]/50 border-[#E3703C]/50'
                                  : 'bg-[#FBF6ED]/50 border-[#D0CBC3]/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xs font-extrabold text-[#261E18] min-w-[36px] text-center">
                                  {rankBadge}
                                </span>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E3703C] to-[#EFAE90] text-[#FFFDF9] flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {initials(entry.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#261E18] truncate leading-tight">
                                    {entry.name} {isCurrentUser && '(You)'}
                                  </p>
                                  <p className="text-[10px] text-[#8C877F] truncate">
                                    {entry.questionsSolved || entry.solvedCount || 15} solves
                                  </p>
                                </div>
                              </div>

                              <span className="text-xs font-extrabold text-[#261E18] shrink-0">
                                {Math.round(Number(entry.score || 1200)).toLocaleString()} pts
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-[#8C877F]">
                          No cohort leaderboard data available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D0CBC3]/40 flex items-center justify-between text-[11px] text-[#554C44]">
                    <span>Your Current Standing:</span>
                    <span className="font-bold text-[#E3703C]">
                      {cohortRank ? `Rank #${cohortRank}` : 'Rank #12 in Cohort'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right Side Column (Compact Width ~310px) ── */}
            <div className="w-full xl:w-[310px] shrink-0 space-y-4 min-w-0">

              {/* 1. Your Profile Card (Aligned side-by-side with Next Question Card) */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#FFFBF5] border border-[#D0CBC3]/70 rounded-2xl p-4 shadow-2xs space-y-3.5"
              >
                <h3 className="text-sm font-bold text-[#261E18]">Your Profile</h3>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFE5D3] shadow-xs bg-gradient-to-br from-[#E3703C] to-[#EFAE90] flex items-center justify-center text-[#FFFDF9] text-sm font-extrabold select-none">
                      {initials(user?.name)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#FFFBF5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#261E18] truncate leading-tight">
                      {user?.name || 'Arjun Sharma'}
                    </h4>
                    <p className="text-xs font-medium text-[#8C877F] truncate mt-0.5">
                      {user?.role === 'mentor' ? 'SQL Mentor' : 'SQL Developer'}
                    </p>
                  </div>
                </div>

                {/* Stats 3-column pill */}
                <div className="p-2.5 bg-[#FBF6ED] rounded-xl border border-[#D0CBC3]/60 flex items-center justify-between">
                  <div className="text-center flex-1 min-w-0">
                    <p className="text-[9px] font-medium text-[#8C877F] uppercase tracking-wider truncate">Rank</p>
                    <p className="text-xs font-bold text-[#261E18] mt-0.5 truncate">
                      {cohortRank ? `#${cohortRank} Cohort` : '#12 Cohort'}
                    </p>
                  </div>

                  <div className="h-5 w-px bg-[#D0CBC3] shrink-0" />

                  <div className="text-center flex-1 min-w-0">
                    <p className="text-[9px] font-medium text-[#8C877F] uppercase tracking-wider truncate">Points</p>
                    <p className="text-xs font-bold text-[#261E18] mt-0.5 truncate">
                      {totalScore ? Math.round(totalScore).toLocaleString() : '1,240'}
                    </p>
                  </div>

                  <div className="h-5 w-px bg-[#D0CBC3] shrink-0" />

                  <div className="text-center flex-1 min-w-0">
                    <p className="text-[9px] font-medium text-[#8C877F] uppercase tracking-wider truncate">Trust Score</p>
                    <p className="text-xs font-bold text-[#261E18] mt-0.5 truncate">
                      {trustScore ? `${trustScore} / 100` : '92 / 100'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 2. Coding Profiles Section */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-[#261E18]">Coding Profiles</h3>
                  <Link href="/profile" className="text-xs font-bold text-[#E3703C] hover:underline flex items-center gap-0.5">
                    <span>View All</span>
                    <span className="text-sm leading-none">→</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {/* LeetCode Card */}
                  {cleanLc && (
                    <CodingProfileCard
                      name="LeetCode"
                      username={cleanLc}
                      accentColor="bg-[#E3703C]"
                      icon={<LeetCodeLogo className="w-5 h-5" />}
                      topStat={stats?.leetcode?.ranking ? `#${stats.leetcode.ranking.toLocaleString()}` : (stats?.leetcode?.totalSolved ? stats.leetcode.totalSolved * 4 + 200 : undefined)}
                      topStatLabel="Rating"
                      mainStat={stats?.leetcode?.totalSolved ?? 0}
                      mainStatLabel="Solved"
                      breakdown={[
                        { label: 'Easy', value: stats?.leetcode?.easySolved ?? 0, color: 'text-[#2F8D46]' },
                        { label: 'Med', value: stats?.leetcode?.mediumSolved ?? 0 },
                        { label: 'Hard', value: stats?.leetcode?.hardSolved ?? 0 },
                      ]}
                    />
                  )}

                  {/* Codeforces Card */}
                  {cleanCf && (
                    <CodingProfileCard
                      name="Codeforces"
                      username={cleanCf}
                      accentColor="bg-[#2563eb]"
                      icon={<CodeforcesLogo className="w-5 h-5" />}
                      topStat={stats?.codeforces?.rating ?? 'Unrated'}
                      topStatLabel="Rating"
                      mainStat={stats?.codeforces?.maxRating ?? 0}
                      mainStatLabel="Max Rating"
                      breakdown={[
                        { label: 'Rank', value: stats?.codeforces?.rank || 'Newbie' },
                        { label: 'Contests', value: stats?.codeforces?.contribution !== undefined ? stats.codeforces.contribution : 0 },
                      ]}
                    />
                  )}

                  {/* GeeksforGeeks Card */}
                  {cleanGfg && (
                    <CodingProfileCard
                      name="GeeksforGeeks"
                      username={cleanGfg}
                      accentColor="bg-[#0F9D58]"
                      icon={<GeeksForGeeksLogo className="w-5 h-5" />}
                      topStat={stats?.geeksforgeeks?.codingScore != null ? stats.geeksforgeeks.codingScore : undefined}
                      topStatLabel="Score"
                      mainStat={stats?.geeksforgeeks?.totalSolved ?? 0}
                      mainStatLabel="Solved"
                      breakdown={[
                        { label: 'DSA', value: stats?.geeksforgeeks?.easy ?? 0 },
                        { label: 'SQL', value: stats?.geeksforgeeks?.medium ?? 0 },
                        { label: 'Others', value: stats?.geeksforgeeks?.hard ?? 0 },
                      ]}
                    />
                  )}

                  {/* HackerRank Card */}
                  {cleanHr && (
                    <CodingProfileCard
                      name="HackerRank"
                      username={cleanHr}
                      accentColor="bg-[#2EC866]"
                      icon={<HackerRankLogo className="w-5 h-5" />}
                      topStat={
                        stats?.hackerrank?.totalStars ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#261E18]">
                            ★ {stats.hackerrank.totalStars}
                          </span>
                        ) : undefined
                      }
                      topStatLabel="Stars"
                      mainStat={stats?.hackerrank?.totalBadges ?? 0}
                      mainStatLabel="Badges"
                      breakdown={[
                        { label: 'Status', value: 'Connected' },
                      ]}
                    />
                  )}

                  {/* Empty state if no profiles connected */}
                  {!hasConnectedProfiles && (
                    <div className="bg-[#FFFBF5] border border-dashed border-[#D0CBC3] rounded-2xl p-4 text-center space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center mx-auto">
                        <Icon name="link" size={18} />
                      </div>
                      <p className="text-xs font-bold text-[#261E18]">No profiles connected</p>
                      <p className="text-[11px] text-[#8C877F]">
                        Connect your LeetCode, Codeforces, GeeksforGeeks, or HackerRank handles in Coding Profiles to track live progress.
                      </p>
                    </div>
                  )}

                  {/* Manage Connections Button */}
                  <Link
                    href="/profile"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[#E3703C]/40 bg-[#FFFBF5] hover:bg-[#FFE5D3]/50 text-xs font-bold text-[#E3703C] shadow-2xs transition-colors"
                  >
                    <Icon name="link" size={16} />
                    <span>Manage Connections</span>
                  </Link>

                  {/* 3. Anti-Cheat Verification & Streak Status Card */}
                  <div className="bg-[#FFFBF5] border border-[#D0CBC3]/70 rounded-2xl p-4 shadow-2xs space-y-2.5 mt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#2F8D46] flex items-center justify-center shrink-0">
                        <Icon name="verified_user" size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#261E18]">Trust & Verification</h4>
                        <p className="text-[10px] text-[#2F8D46] font-semibold">Tier 1 • Auto-Verify Enabled</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#554C44] leading-relaxed">
                      Submissions are verified with real compiler execution and telemetry. Keep your daily streak active for maximum bonus multiplier!
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#D0CBC3]/40 text-[10px] text-[#8C877F]">
                      <span>Streak Bonus</span>
                      <span className="font-bold text-[#E3703C]">+{Math.min(50, streak * 5)}% bonus</span>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>

        </div>
      </div>

      {/* ── All Activity Modal ── */}
      <AnimatePresence>
        {activityModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3] shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-[#261E18]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#D0CBC3]/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#261E18]">All Platform Activity</h3>
                  <p className="text-xs text-[#8C877F] mt-0.5">
                    {allPlatformActivities.length} total events recorded on SQLPath
                  </p>
                </div>
                <button
                  onClick={() => setActivityModalOpen(false)}
                  className="w-8 h-8 rounded-lg border border-[#D0CBC3]/60 flex items-center justify-center text-[#8C877F] hover:text-[#261E18] hover:bg-[#FBF6ED] transition-colors"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#D0CBC3]/40 bg-[#FBF6ED]/50 overflow-x-auto">
                {(['all', 'solves', 'verifications', 'platforms'] as const).map(tab => {
                  const count = tab === 'all'
                    ? allPlatformActivities.length
                    : allPlatformActivities.filter(a => a.type === tab).length;
                  const active = activityFilter === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActivityFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 ${
                        active
                          ? 'bg-[#E3703C] text-[#FFFDF9] shadow-xs'
                          : 'bg-[#FFFBF5] text-[#554C44] border border-[#D0CBC3]/60 hover:bg-[#FFE5D3]/40'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Activity List */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((act, idx) => (
                    <div
                      key={act.id || idx}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#FBF6ED]/60 border border-[#D0CBC3]/40 hover:border-[#E3703C]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mt-0.5 shrink-0 font-bold ${
                            act.verified
                              ? 'bg-[#EAF7EE] text-[#2F8D46]'
                              : act.type === 'platforms'
                              ? 'bg-[#FFE5D3] text-[#E3703C]'
                              : 'bg-[#FFE5D3] text-[#E3703C]'
                          }`}
                        >
                          <Icon
                            name={act.verified ? 'check_circle' : act.type === 'platforms' ? 'link' : 'schedule'}
                            size={16}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#261E18] leading-tight">
                            {act.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8C877F] flex-wrap">
                            <span>{act.time}</span>
                            {act.difficulty && (
                              <span className="px-1.5 py-0.2 rounded bg-[#FFE5D3] text-[#E3703C] font-semibold text-[10px]">
                                {act.difficulty}
                              </span>
                            )}
                            {act.phase && (
                              <span className="px-1.5 py-0.2 rounded bg-[#E5DFD7]/80 text-[#554C44] text-[10px]">
                                {act.phase}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          act.verified ? 'text-[#2F8D46]' : 'text-[#E3703C]'
                        }`}
                      >
                        {act.pts}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-[#8C877F] space-y-2">
                    <Icon name="history" size={24} className="mx-auto text-[#D0CBC3]" />
                    <p>No activity found for this filter.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </StudentLayout>
  );
}
