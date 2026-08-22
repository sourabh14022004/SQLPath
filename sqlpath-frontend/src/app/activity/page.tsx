'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
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

export default function ActivityPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mySolves, setMySolves] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [usernames, setUsernames] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'solves' | 'verifications' | 'platforms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }

    Promise.all([
      api.getMySolves(token).catch(() => []),
      api.getEngagement(token).catch(() => null),
      api.getPlatformUsernames(token).catch(() => ({ leetcode: null, codeforces: null, geeksforgeeks: null, hackerrank: null })),
    ]).then(([sv, eng, unames]) => {
      setMySolves(Array.isArray(sv) ? sv : []);
      setEngagement(eng);
      setUsernames(unames);

      const hasAny = Boolean(unames?.leetcode || unames?.codeforces || unames?.geeksforgeeks || unames?.hackerrank);
      if (hasAny) {
        api.getProfileStats(token).then(setStats).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [token, authLoading, user?.role]);

  const cleanLc = cleanHandle(usernames?.leetcode);
  const cleanCf = cleanHandle(usernames?.codeforces);
  const cleanGfg = cleanHandle(usernames?.geeksforgeeks);
  const cleanHr = cleanHandle(usernames?.hackerrank);

  // ── Build Full History List ────────────────────────────────────────────────
  const allActivities = useMemo(() => {
    const list: any[] = [];

    // 1. Solves & Submissions
    mySolves.forEach((s: any) => {
      const qTitle = s.question?.title || `Question #${s.questionId?.slice(0, 4) || '1'}`;
      const isAuto = s.status === 'auto_verified';
      const isMentor = s.status === 'mentor_verified';
      const isVerified = isAuto || isMentor;

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
      let icon = 'schedule';

      if (isAuto) {
        title = `Auto-verified ${qTitle}`;
        type = 'verifications';
        icon = 'check_circle';
      } else if (isMentor) {
        title = `Mentor verified ${qTitle}`;
        type = 'verifications';
        icon = 'verified_user';
      }

      list.push({
        id: s.id,
        title,
        questionId: s.questionId,
        time: timeStr,
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: date.getTime(),
        pts: s.pointsAwarded ? `+${s.pointsAwarded} pts` : (isVerified ? '+15 pts' : 'Pending review'),
        status: s.status,
        type,
        difficulty: s.question?.difficulty || 'Medium',
        phase: s.question?.phase ? `Phase ${s.question.phase}` : undefined,
        verified: isVerified,
        icon,
      });
    });

    // 2. Connected Platforms
    if (cleanLc) {
      list.push({
        id: 'plat-lc',
        title: `Connected LeetCode (@${cleanLc})`,
        time: 'Live Synced',
        dateFormatted: 'Connected Profile',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.leetcode?.totalSolved ? `${stats.leetcode.totalSolved} solved` : 'Connected',
        type: 'platforms',
        verified: true,
        icon: 'link',
      });
    }
    if (cleanCf) {
      list.push({
        id: 'plat-cf',
        title: `Connected Codeforces (@${cleanCf})`,
        time: 'Live Synced',
        dateFormatted: 'Connected Profile',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.codeforces?.rating ? `${stats.codeforces.rating} rating` : 'Connected',
        type: 'platforms',
        verified: true,
        icon: 'link',
      });
    }
    if (cleanGfg) {
      list.push({
        id: 'plat-gfg',
        title: `Connected GeeksforGeeks (@${cleanGfg})`,
        time: 'Live Synced',
        dateFormatted: 'Connected Profile',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.geeksforgeeks?.totalSolved ? `${stats.geeksforgeeks.totalSolved} solved` : 'Connected',
        type: 'platforms',
        verified: true,
        icon: 'link',
      });
    }
    if (cleanHr) {
      list.push({
        id: 'plat-hr',
        title: `Connected HackerRank (@${cleanHr})`,
        time: 'Live Synced',
        dateFormatted: 'Connected Profile',
        rawDate: Date.now() - 3600000 * 36,
        pts: stats?.hackerrank?.totalBadges ? `${stats.hackerrank.totalBadges} badges` : 'Connected',
        type: 'platforms',
        verified: true,
        icon: 'link',
      });
    }

    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [mySolves, cleanLc, cleanCf, cleanGfg, cleanHr, stats]);

  // Filter & Search
  const filteredList = useMemo(() => {
    return allActivities.filter(a => {
      if (filter !== 'all' && a.type !== filter) return false;
      if (searchQuery.trim() && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allActivities, filter, searchQuery]);

  // 12-week heatmap
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

  const verifiedSolvesCount = mySolves.filter(s => s.status === 'mentor_verified' || s.status === 'auto_verified').length;

  if (loading || authLoading) {
    return (
      <StudentLayout>
        <div className="pt-[20px] px-5 md:px-7 max-w-[1440px] mx-auto space-y-6 pb-16 bg-[#FBF6ED]">
          <Skeleton className="h-20 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-44 rounded-2xl" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="h-full overflow-y-auto bg-[#FBF6ED]">
        <div className="pt-[20px] px-5 md:px-7 max-w-[1440px] mx-auto space-y-6 pb-16">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-[#261E18] tracking-tight">
                Activity & Total History
              </h1>
              <p className="text-xs font-medium text-[#554C44] mt-1">
                Complete timeline of all your questions solved, submissions, verifications, and external platform syncs.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFBF5] border border-[#D0CBC3] hover:bg-[#FFE5D3]/40 text-[#261E18] text-xs font-bold shadow-2xs transition-colors"
            >
              <Icon name="dashboard" size={16} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* ── 4 Top Summary Stat Cards ── */}
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* 1. Total Activity Events */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                  <Icon name="history" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {allActivities.length}
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Total Activities Logged</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Verified Solves */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF7EE] text-[#2F8D46] flex items-center justify-center">
                  <Icon name="check_circle" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {verifiedSolvesCount}
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Verified Solves</span>
                </div>
              </div>
            </motion.div>

            {/* 3. Streak Days */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                  <Icon name="local_fire_department" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {engagement?.currentStreak ?? user?.currentStreak ?? 14}
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Day Streak</span>
                </div>
              </div>
            </motion.div>

            {/* 4. Total Points Earned */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF1E9] text-[#EFAE90] flex items-center justify-center">
                  <Icon name="emoji_events" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {Math.round(Number(engagement?.totalScore ?? user?.score ?? 1240)).toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Total Points</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Activity Heatmap (12 Weeks) ── */}
          <div className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#261E18]">12-Week Solve Intensity Heatmap</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#8C877F]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E5DFD7]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#FFE5D3]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EFAE90]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E3703C]" />
                <span>More</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex flex-col justify-between text-[10px] text-[#8C877F] font-medium py-0.5">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              <div className="grid grid-flow-col grid-rows-7 gap-[4px] flex-1">
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
                        className={`w-full h-3.5 rounded-[3px] ${bg} hover:scale-125 transition-transform cursor-pointer`}
                        title={`${val} solves`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8C877F] font-medium pt-1 px-8">
              <span>12 weeks ago</span>
              <span>This week</span>
            </div>
          </div>

          {/* ── Search & Filter Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFBF5] p-3 rounded-2xl border border-[#D0CBC3]/70">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['all', 'solves', 'verifications', 'platforms'] as const).map(tab => {
                const count = tab === 'all'
                  ? allActivities.length
                  : allActivities.filter(a => a.type === tab).length;
                const active = filter === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                      active
                        ? 'bg-[#E3703C] text-[#FFFDF9] shadow-xs'
                        : 'bg-[#FBF6ED] text-[#554C44] border border-[#D0CBC3]/60 hover:bg-[#FFE5D3]/40'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C877F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search activity by title..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-[#FBF6ED] border border-[#D0CBC3]/70 focus:border-[#E3703C] focus:outline-none text-[#261E18] placeholder-[#8C877F]"
              />
            </div>
          </div>

          {/* ── Comprehensive Chronological Activity List ── */}
          <div className="space-y-3">
            {filteredList.length > 0 ? (
              filteredList.map((act) => (
                <motion.div
                  key={act.id}
                  variants={fadeUp}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFBF5] border border-[#D0CBC3]/70 shadow-2xs hover:shadow-xs hover:border-[#E3703C]/50 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 font-bold ${
                        act.verified
                          ? 'bg-[#EAF7EE] text-[#2F8D46]'
                          : 'bg-[#FFE5D3] text-[#E3703C]'
                      }`}
                    >
                      <Icon name={act.icon} size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#261E18] leading-tight truncate">
                          {act.title}
                        </p>
                        {act.difficulty && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFE5D3] text-[#E3703C] font-bold text-[10px]">
                            {act.difficulty}
                          </span>
                        )}
                        {act.phase && (
                          <span className="px-2 py-0.5 rounded-md bg-[#E5DFD7]/80 text-[#554C44] font-medium text-[10px]">
                            {act.phase}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-[#8C877F]">
                        <span>{act.time}</span>
                        <span>•</span>
                        <span>{act.dateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        act.verified
                          ? 'bg-[#EAF7EE] text-[#2F8D46]'
                          : 'bg-[#FFE5D3] text-[#E3703C]'
                      }`}
                    >
                      {act.pts}
                    </span>

                    {act.questionId && (
                      <Link
                        href={`/roadmap/${act.questionId}`}
                        className="w-8 h-8 rounded-xl bg-[#FBF6ED] border border-[#D0CBC3]/70 hover:bg-[#FFE5D3]/50 text-[#E3703C] flex items-center justify-center transition-colors"
                        title="View question on roadmap"
                      >
                        <Icon name="arrow_forward" size={16} />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-[#8C877F] bg-[#FFFBF5] rounded-2xl border border-dashed border-[#D0CBC3] space-y-2">
                <Icon name="history" size={28} className="mx-auto text-[#D0CBC3]" />
                <p className="font-bold text-[#261E18]">No activity found</p>
                <p>Try clearing your search query or switching the category filter.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}
