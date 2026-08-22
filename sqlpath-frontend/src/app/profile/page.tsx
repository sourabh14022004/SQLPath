'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import { initials } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

// ── Handle Cleaner / Normalizer ──────────────────────────────────────────────
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

// ── Platform Logos & Icons (Crisp SVGs) ───────────────────────────────────────
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

function GfgLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#2F8D46" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">GfG</text>
    </svg>
  );
}

function HackerrankLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="12" fill="#00EA64" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1a1a" fontFamily="Arial">HR</text>
    </svg>
  );
}

// ── Rating Rank Color ────────────────────────────────────────────────────────
function cfRankColor(rank: string): string {
  if (!rank) return 'text-on-surface-variant';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('international grandmaster')) return 'text-red-500';
  if (r.includes('grandmaster')) return 'text-red-400';
  if (r.includes('master')) return 'text-orange-400';
  if (r.includes('candidate')) return 'text-purple-500';
  if (r.includes('expert')) return 'text-blue-500';
  if (r.includes('specialist')) return 'text-cyan-500';
  if (r.includes('pupil')) return 'text-green-500';
  return 'text-on-surface-variant';
}

// ── SVG Donut Chart Component ────────────────────────────────────────────────
function DonutChart({
  total,
  segments,
  size = 140,
  strokeWidth = 14,
  centerLabel = 'Solved',
}: {
  total: number;
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;

  let accumulatedPercent = 0;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />
        {total > 0 &&
          segments.map((seg, idx) => {
            if (seg.value <= 0) return null;
            const strokeDasharray = `${(seg.value / safeTotal) * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += seg.value / safeTotal;
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-title-lg font-bold text-slate-900 leading-tight tracking-tight">
          {total.toLocaleString()}
        </span>
        {centerLabel && (
          <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Rating Progression Curve Chart ───────────────────────────────────────────
function RatingCurveChart({
  rating,
  maxRating,
  rank,
}: {
  rating?: number | null;
  maxRating?: number | null;
  rank?: string | null;
}) {
  if (!rating || rating <= 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Icon name="show_chart" size={32} className="text-slate-300 mx-auto" />
        <p className="text-body-sm text-slate-500 font-medium">
          Connect your Codeforces handle to see your live contest rating graph.
        </p>
      </div>
    );
  }

  const current = rating;
  const peak = maxRating || current;
  const initialEstimate = Math.max(800, Math.round(current * 0.85));
  const midEstimate = Math.round((initialEstimate + current) / 2);

  const data = [
    { label: 'Initial', rating: initialEstimate },
    { label: 'Midway', rating: midEstimate },
    { label: 'Peak', rating: peak },
    { label: 'Current', rating: current },
  ];

  const minRating = Math.max(0, Math.min(...data.map(d => d.rating)) - 100);
  const maxScale = Math.max(...data.map(d => d.rating)) + 100;

  const width = 480;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.rating - minRating) / (maxScale - minRating)) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const curvePath = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = a[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaPath = `${curvePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="w-full relative">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Rating</div>
          <div className="text-2xl font-bold text-slate-900 leading-tight">{current}</div>
        </div>
        <div className="text-right">
          <div className="text-label-sm font-semibold text-slate-800">Peak: {peak}</div>
          <div className={`text-label-xs font-semibold capitalize ${cfRankColor(rank || '')}`}>
            {rank || 'Rated'}
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="cfRatingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1" />
          <path d={areaPath} fill="url(#cfRatingGradient)" />
          <path d={curvePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={i === points.length - 1 ? 5 : 3.5}
                fill={i === points.length - 1 ? '#f97316' : '#ffffff'}
                stroke="#f97316"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Hexagonal Badge Component ────────────────────────────────────────────────
function HexBadge({
  icon,
  title,
  subtitle,
  unlocked = true,
  color = '#e86b32',
}: {
  icon: string | React.ReactNode;
  title: string;
  subtitle?: string;
  unlocked?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 group cursor-pointer transition-opacity shrink-0 ${unlocked ? 'opacity-100' : 'opacity-40'}`}
      title={`${title} ${subtitle ? `(${subtitle})` : ''} - ${unlocked ? 'Unlocked' : 'Locked'}`}
    >
      <div className="relative w-14 h-16 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <svg viewBox="0 0 100 115" className="w-full h-full drop-shadow-2xs">
          <polygon
            points="50 0, 100 25, 100 85, 50 115, 0 85, 0 25"
            fill={unlocked ? '#ffffff' : '#f1f5f9'}
            stroke={unlocked ? color : '#cbd5e1'}
            strokeWidth="4"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
          {typeof icon === 'string' ? (
            <span className="text-xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>
      <span className="text-[11px] font-semibold text-slate-800 text-center max-w-[72px] truncate">
        {title}
      </span>
    </div>
  );
}

// ── Platform Connect Modal ───────────────────────────────────────────────────
type ConnectPlatform = 'leetcode' | 'codeforces' | 'geeksforgeeks' | 'hackerrank';

function ConnectModal({
  platform,
  onClose,
  token,
  onLeetcodeConnect,
  onCfConnect,
  onGfgConnect,
  onHrConnect,
}: {
  platform: ConnectPlatform | null;
  onClose: () => void;
  token: string;
  onLeetcodeConnect: (u: string) => Promise<void>;
  onCfConnect: (u: string) => Promise<void>;
  onGfgConnect: (u: string) => Promise<void>;
  onHrConnect: (u: string) => Promise<void>;
}) {
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!platform) return null;

  const leetcodeToken = token ? token.slice(0, 8).toUpperCase() : 'SQLPATH';

  const handleSave = async () => {
    const cleaned = cleanHandle(handle);
    if (!cleaned) return;
    setSaving(true);
    setError('');
    try {
      if (platform === 'leetcode') await onLeetcodeConnect(cleaned);
      else if (platform === 'codeforces') await onCfConnect(cleaned);
      else if (platform === 'geeksforgeeks') await onGfgConnect(cleaned);
      else if (platform === 'hackerrank') await onHrConnect(cleaned);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect handle');
    } finally {
      setSaving(false);
    }
  };

  const platformMeta: Record<ConnectPlatform, { title: string; placeholder: string; icon: React.ReactNode }> = {
    leetcode: { title: 'Connect LeetCode', placeholder: 'your-leetcode-username', icon: <LeetCodeLogo className="w-6 h-6" /> },
    codeforces: { title: 'Connect Codeforces', placeholder: 'your-codeforces-handle', icon: <CodeforcesLogo className="w-6 h-6" /> },
    geeksforgeeks: { title: 'Connect GeeksforGeeks', placeholder: 'your-gfg-username', icon: <GfgLogo className="w-6 h-6" /> },
    hackerrank: { title: 'Connect HackerRank', placeholder: 'your-hackerrank-username', icon: <HackerrankLogo className="w-6 h-6" /> },
  };
  const meta = platformMeta[platform];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {meta.icon}
            <h3 className="text-title-md font-bold text-slate-900">{meta.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <Icon name="close" size={20} />
          </button>
        </div>

        {platform === 'leetcode' && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5 text-body-sm text-slate-800">
            <div className="font-semibold flex items-center gap-1.5 text-amber-700">
              <Icon name="verified_user" size={16} />
              Bio Verification
            </div>
            <p className="text-slate-600 text-label-sm">
              Add the following token into your LeetCode profile bio:
            </p>
            <div className="font-code text-code bg-white border border-amber-300 rounded-md px-2.5 py-1 text-primary select-all inline-block font-bold">
              SQLPATH-{leetcodeToken}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-label-sm font-medium text-slate-600">Profile Username / Handle</label>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={meta.placeholder}
            className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-slate-900 outline-none transition-all"
            autoFocus
          />
          {error && <p className="text-label-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-label-md text-slate-500 hover:text-slate-800 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSave}
            disabled={saving || !handle.trim()}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 bg-primary text-white text-label-md font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs"
          >
            {saving ? 'Connecting…' : 'Save Connection'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Profile Page Component ──────────────────────────────────────────────
export default function ProfilePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [usernames, setUsernames] = useState<{
    leetcode: string | null;
    leetcodeVerified: boolean;
    codeforces: string | null;
    geeksforgeeks: string | null;
    hackerrank: string | null;
  } | null>(null);

  const [stats, setStats] = useState<{ leetcode: any | null; codeforces: any | null; geeksforgeeks: any | null; hackerrank: any | null } | null>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [mySolves, setMySolves] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [connectModalPlatform, setConnectModalPlatform] = useState<ConnectPlatform | null>(null);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ date: string; count: number } | null>(null);

  // Load all user real data from backend
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user?.role && user.role !== 'student') {
      router.replace('/mentor');
      return;
    }

    Promise.all([
      api.getPlatformUsernames(token).catch(() => ({ leetcode: null, leetcodeVerified: false, codeforces: null, geeksforgeeks: null, hackerrank: null })),
      api.getEngagement(token).catch(() => null),
      api.getMySolves(token).catch(() => []),
      api.getLeaderboard(token, 'alltime').catch(() => []),
    ])
      .then(([uNames, eng, solves, lboard]) => {
        setUsernames(uNames);
        setEngagement(eng);
        setMySolves(solves || []);
        setLeaderboard(lboard || []);
      })
      .finally(() => setLoading(false));
  }, [token, user?.role, authLoading]);

  // Load connected external stats
  useEffect(() => {
    if (!token || !usernames) return;
    if (!usernames.leetcode && !usernames.codeforces && !usernames.geeksforgeeks && !usernames.hackerrank) return;

    setStatsLoading(true);
    api.getProfileStats(token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [token, usernames]);

  // Connect Handlers
  const handleLeetcodeConnect = async (username: string) => {
    const clean = cleanHandle(username);
    await api.setLeetcodeUsername(token!, clean);
    const updated = await api.getPlatformUsernames(token!);
    setUsernames(updated);
    setStatsLoading(true);
    api.getProfileStats(token!).then(setStats).finally(() => setStatsLoading(false));
  };

  const handleCfConnect = async (username: string) => {
    const clean = cleanHandle(username);
    await api.saveCodeforcesUsername(token!, clean);
    const updated = await api.getPlatformUsernames(token!);
    setUsernames(updated);
    setStatsLoading(true);
    api.getProfileStats(token!).then(setStats).finally(() => setStatsLoading(false));
  };

  const handleCfDisconnect = async () => {
    await api.saveCodeforcesUsername(token!, null);
    setUsernames(u => u ? { ...u, codeforces: null } : u);
    setStats(s => s ? { ...s, codeforces: null } : s);
  };

  const handleGfgConnect = async (username: string) => {
    const clean = cleanHandle(username);
    await api.saveGeeksforgeeksUsername(token!, clean);
    const updated = await api.getPlatformUsernames(token!);
    setUsernames(updated);
    setStatsLoading(true);
    api.getProfileStats(token!).then(setStats).finally(() => setStatsLoading(false));
  };

  const handleGfgDisconnect = async () => {
    await api.saveGeeksforgeeksUsername(token!, null);
    setUsernames(u => u ? { ...u, geeksforgeeks: null } : u);
    setStats(s => s ? { ...s, geeksforgeeks: null } : s);
  };

  const handleHrConnect = async (username: string) => {
    const clean = cleanHandle(username);
    await api.saveHackerrankUsername(token!, clean);
    const updated = await api.getPlatformUsernames(token!);
    setUsernames(updated);
    setStatsLoading(true);
    api.getProfileStats(token!).then(setStats).finally(() => setStatsLoading(false));
  };

  const handleHrDisconnect = async () => {
    await api.saveHackerrankUsername(token!, null);
    setUsernames(u => u ? { ...u, hackerrank: null } : u);
    setStats(s => s ? { ...s, hackerrank: null } : s);
  };

  // ── Compute Real Metrics ───────────────────────────────────────────────────
  const leetcodeStats = stats?.leetcode;
  const cfStats = stats?.codeforces;
  const gfgStats = stats?.geeksforgeeks;
  const hrStats = stats?.hackerrank;

  // Real SQL solves
  const sqlVerifiedSolves = useMemo(() => {
    return mySolves.filter(s => s.status === 'auto_verified' || s.status === 'mentor_verified');
  }, [mySolves]);

  const sqlEasy = sqlVerifiedSolves.filter(s => s.question?.difficulty === 'easy').length;
  const sqlMedium = sqlVerifiedSolves.filter(s => s.question?.difficulty === 'medium').length;
  const sqlHard = sqlVerifiedSolves.filter(s => s.question?.difficulty === 'hard').length;

  // Real External solves
  const lcTotal = leetcodeStats?.totalSolved || 0;
  const lcEasy = leetcodeStats?.easySolved || 0;
  const lcMedium = leetcodeStats?.mediumSolved || 0;
  const lcHard = leetcodeStats?.hardSolved || 0;
  const gfgTotal = gfgStats?.totalSolved || 0;
  const gfgEasy = gfgStats?.easySolved || 0;
  const gfgMedium = gfgStats?.mediumSolved || 0;
  const gfgHard = gfgStats?.hardSolved || 0;

  // Combined real counts
  const totalSolved = sqlVerifiedSolves.length + lcTotal + gfgTotal;
  const easyCount = sqlEasy + lcEasy + gfgEasy;
  const mediumCount = sqlMedium + lcMedium + gfgMedium;
  const hardCount = sqlHard + lcHard + gfgHard;
  const totalDiffSolved = easyCount + mediumCount + hardCount;

  // Real Streaks & Active Days
  const currentStreak = engagement?.currentStreak ?? user?.currentStreak ?? 0;
  const longestStreak = engagement?.longestStreak ?? user?.longestStreak ?? 0;
  const totalScore = Number(engagement?.totalScore ?? 0);
  const trustScore = engagement?.trustScore ?? user?.trustScore ?? 80;

  // Real Heatmap Data from engagement endpoint
  const realHeatmap: { date: string; solvesCount: number; pointsEarned: number }[] = engagement?.heatmap ?? [];
  const activeDaysCount = realHeatmap.filter(h => h.solvesCount > 0).length || (sqlVerifiedSolves.length > 0 ? 1 : 0);
  const totalSubmissions = realHeatmap.reduce((sum, h) => sum + (h.solvesCount || 0), 0) || mySolves.length;

  // Real Leaderboard Rank
  const userRankEntry = leaderboard.find(l => l.id === user?.id);
  const myRank = userRankEntry ? Number(userRankEntry.rank) : null;
  const totalStudents = leaderboard.length || 1;
  const rankPercentile = myRank ? Math.max(1, Math.round((myRank / totalStudents) * 100)) : null;

  // Clean handles for display
  const cleanLcHandle = cleanHandle(usernames?.leetcode);
  const cleanCfHandle = cleanHandle(usernames?.codeforces);
  const cleanGfgHandle = cleanHandle(usernames?.geeksforgeeks);
  const cleanHrHandle = cleanHandle(usernames?.hackerrank);

  // Real Achievements / Badges
  const badgesList = useMemo(() => {
    const list = [
      {
        id: 'first_solve',
        icon: '🚀',
        title: 'First Solve',
        subtitle: '1 Problem',
        unlocked: sqlVerifiedSolves.length >= 1,
        color: '#f97316',
      },
      {
        id: 'streak_3',
        icon: '🔥',
        title: '3-Day Streak',
        subtitle: 'Consistency',
        unlocked: currentStreak >= 3 || longestStreak >= 3,
        color: '#ef4444',
      },
      {
        id: 'streak_7',
        icon: '⚡',
        title: '7-Day Streak',
        subtitle: 'Dedicated',
        unlocked: longestStreak >= 7,
        color: '#eab308',
      },
      {
        id: 'high_trust',
        icon: '🛡️',
        title: 'High Trust',
        subtitle: 'Score ≥ 80',
        unlocked: trustScore >= 80,
        color: '#10b981',
      },
      {
        id: 'sql_vet',
        icon: '💎',
        title: 'SQL Veteran',
        subtitle: '10 Solves',
        unlocked: sqlVerifiedSolves.length >= 10,
        color: '#3b82f6',
      },
      {
        id: 'score_100',
        icon: '🏆',
        title: 'Centurion',
        subtitle: '100 Points',
        unlocked: totalScore >= 100,
        color: '#8b5cf6',
      },
    ];

    if (leetcodeStats?.badges && Array.isArray(leetcodeStats.badges)) {
      leetcodeStats.badges.slice(0, 4).forEach((b: any, idx: number) => {
        list.push({
          id: `lc_${idx}`,
          icon: '🏅',
          title: b.displayName || 'LeetCode Badge',
          subtitle: 'LeetCode',
          unlocked: true,
          color: '#eab308',
        });
      });
    }

    return list;
  }, [sqlVerifiedSolves.length, currentStreak, longestStreak, trustScore, totalScore, leetcodeStats?.badges]);

  if (loading || authLoading) {
    return (
      <StudentLayout>
        <main className="px-4 md:px-8 py-8 pb-12 max-w-[1440px] mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </main>
      </StudentLayout>
    );
  }

  const displayName = user?.name || 'User';
  const handleName = user?.email ? user.email.split('@')[0] : 'user';

  return (
    <StudentLayout>
      <main className="px-4 sm:px-6 lg:px-8 py-8 pb-16 max-w-[1440px] mx-auto">
        <motion.div
          variants={staggerContainer(0.06, 0.04)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* ══════════════════════════════════════════════════════════════════════
              LEFT COLUMN: Real User Bio, Platform Connections & Leaderboard
             ══════════════════════════════════════════════════════════════════════ */}
          <motion.div variants={fadeUp} className="lg:col-span-3 space-y-6">
            {/* User Bio Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center space-y-4 overflow-hidden">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center text-white text-2xl font-bold select-none">
                  {initials(displayName)}
                </div>
              </div>

              <div className="w-full">
                <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">
                  {displayName}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-label-sm font-semibold text-primary truncate max-w-[180px]">
                    @{handleName}
                  </span>
                  <Icon name="verified" size={16} filled className="text-emerald-500 shrink-0" />
                </div>
                <div className="text-label-sm text-slate-500 font-medium mt-0.5 capitalize truncate">
                  {user?.role === 'mentor' ? 'SQL Mentor' : user?.role === 'admin' ? 'Administrator' : 'Student & SQL Learner'}
                </div>
              </div>

              {/* Contact Icons */}
              <div className="flex items-center justify-center gap-3 pt-1 text-slate-400">
                {user?.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
                    title={user.email}
                  >
                    <Icon name="mail" size={17} />
                  </a>
                )}
                {cleanLcHandle && (
                  <a
                    href={`https://leetcode.com/${cleanLcHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:text-amber-500 hover:border-amber-500 transition-colors"
                    title={`LeetCode: ${cleanLcHandle}`}
                  >
                    <LeetCodeLogo className="w-4 h-4" />
                  </a>
                )}
                {cleanCfHandle && (
                  <a
                    href={`https://codeforces.com/profile/${cleanCfHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:text-blue-500 hover:border-blue-500 transition-colors"
                    title={`Codeforces: ${cleanCfHandle}`}
                  >
                    <CodeforcesLogo className="w-4 h-4" />
                  </a>
                )}
                {cleanGfgHandle && (
                  <a
                    href={`https://www.geeksforgeeks.org/user/${cleanGfgHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-green-600 transition-colors"
                    title={`GeeksforGeeks: ${cleanGfgHandle}`}
                  >
                    <GfgLogo className="w-4 h-4" />
                  </a>
                )}
                {cleanHrHandle && (
                  <a
                    href={`https://www.hackerrank.com/${cleanHrHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-green-400 transition-colors"
                    title={`HackerRank: ${cleanHrHandle}`}
                  >
                    <HackerrankLogo className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Real User Meta info */}
              <div className="w-full border-t border-slate-100 pt-3 space-y-2 text-left text-label-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Icon name="school" size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {user?.cohortId ? `Cohort: ${user.cohortId.slice(0, 8)}` : 'SQLPath Core Track'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="verified_user" size={16} className="text-slate-400 shrink-0" />
                  <span>Trust Score: <strong className="text-slate-900">{trustScore}</strong>/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="history" size={16} className="text-slate-400 shrink-0" />
                  <span>Total Points: <strong className="text-primary font-bold">{totalScore}</strong></span>
                </div>
              </div>
            </div>

            {/* Connected Platforms Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 overflow-hidden">
              <div className="flex items-center justify-between text-label-md font-bold text-slate-800 uppercase tracking-wide">
                <span>External Platforms</span>
                <span className="text-label-xs font-normal text-slate-400">
                  {statsLoading ? 'Syncing…' : 'Live'}
                </span>
              </div>

              <div className="space-y-3">
                {/* LeetCode */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <LeetCodeLogo className="w-5 h-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-label-md font-semibold text-slate-800 block leading-tight truncate">LeetCode</span>
                      <span className="text-[11px] text-slate-400 block truncate" title={cleanLcHandle ? `@${cleanLcHandle}` : 'Not connected'}>
                        {cleanLcHandle ? `@${cleanLcHandle}` : 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {cleanLcHandle ? (
                      <>
                        <Icon name="check_circle" size={17} filled className="text-emerald-500 shrink-0" />
                        <a
                          href={`https://leetcode.com/${cleanLcHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors p-1"
                          title="Open profile"
                        >
                          <Icon name="open_in_new" size={15} />
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => setConnectModalPlatform('leetcode')}
                        className="text-label-xs font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Codeforces */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <CodeforcesLogo className="w-5 h-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-label-md font-semibold text-slate-800 block leading-tight truncate">Codeforces</span>
                      <span className="text-[11px] text-slate-400 block truncate" title={cleanCfHandle ? `@${cleanCfHandle}` : 'Not connected'}>
                        {cleanCfHandle ? `@${cleanCfHandle}` : 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {cleanCfHandle ? (
                      <>
                        <Icon name="check_circle" size={17} filled className="text-emerald-500 shrink-0" />
                        <a
                          href={`https://codeforces.com/profile/${cleanCfHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors p-1"
                          title="Open profile"
                        >
                          <Icon name="open_in_new" size={15} />
                        </a>
                        <button
                          onClick={handleCfDisconnect}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          title="Disconnect Codeforces"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConnectModalPlatform('codeforces')}
                        className="text-label-xs font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* GeeksforGeeks */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <GfgLogo className="w-5 h-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-label-md font-semibold text-slate-800 block leading-tight truncate">GeeksforGeeks</span>
                      <span className="text-[11px] text-slate-400 block truncate" title={cleanGfgHandle ? `@${cleanGfgHandle}` : 'Not connected'}>
                        {cleanGfgHandle ? `@${cleanGfgHandle}` : 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {cleanGfgHandle ? (
                      <>
                        <Icon name="check_circle" size={17} filled className="text-emerald-500 shrink-0" />
                        {gfgStats?.totalSolved != null && (
                          <span className="text-[11px] font-bold text-green-700">{gfgStats.totalSolved} solved</span>
                        )}
                        <a
                          href={`https://www.geeksforgeeks.org/user/${cleanGfgHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors p-1"
                          title="Open profile"
                        >
                          <Icon name="open_in_new" size={15} />
                        </a>
                        <button
                          onClick={handleGfgDisconnect}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          title="Disconnect GeeksforGeeks"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConnectModalPlatform('geeksforgeeks')}
                        className="text-label-xs font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* HackerRank */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <HackerrankLogo className="w-5 h-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-label-md font-semibold text-slate-800 block leading-tight truncate">HackerRank</span>
                      <span className="text-[11px] text-slate-400 block truncate" title={cleanHrHandle ? `@${cleanHrHandle}` : 'Not connected'}>
                        {cleanHrHandle ? `@${cleanHrHandle}` : 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {cleanHrHandle ? (
                      <>
                        <Icon name="check_circle" size={17} filled className="text-emerald-500 shrink-0" />
                        {hrStats?.totalStars != null && (
                          <span className="text-[11px] font-bold text-green-600">★ {hrStats.totalStars}</span>
                        )}
                        <a
                          href={`https://www.hackerrank.com/${cleanHrHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors p-1"
                          title="Open profile"
                        >
                          <Icon name="open_in_new" size={15} />
                        </a>
                        <button
                          onClick={handleHrDisconnect}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          title="Disconnect HackerRank"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConnectModalPlatform('hackerrank')}
                        className="text-label-xs font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Real Leaderboard Rank Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-2xl border border-amber-200/70 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-label-sm font-bold text-slate-800">Global Rank</div>
                  <div className="text-[11px] text-slate-500">SQLPath Leaderboard</div>
                </div>
                <Icon name="leaderboard" size={20} className="text-amber-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {myRank ? `#${myRank}` : '—'}
                </span>
                {rankPercentile && (
                  <span className="text-label-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Top {rankPercentile}%
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════════
              CENTER COLUMN: Solved Stats, Heatmap, Contests & Badges
             ══════════════════════════════════════════════════════════════════════ */}
          <motion.div variants={fadeUp} className="lg:col-span-6 space-y-6">
            {/* Top Stat Row: Questions Solved, Active Days, Real Heatmap */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Questions Solved Card */}
              <div className="sm:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Questions Solved
                  </span>
                  <Icon name="check_circle" size={15} className="text-slate-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {totalSolved.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {sqlVerifiedSolves.length} SQL · {lcTotal} LC{gfgTotal > 0 ? ` · ${gfgTotal} GfG` : ''}
                </div>
              </div>

              {/* Active Days Card */}
              <div className="sm:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Active Days
                  </span>
                  <Icon name="calendar_today" size={15} className="text-slate-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {activeDaysCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Streak: {currentStreak}d
                </div>
              </div>

              {/* Submissions & Heatmap Widget Header */}
              <div className="sm:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pb-2">
                  <div className="flex items-center gap-3">
                    <span>Submissions <strong className="text-slate-900 font-bold">{totalSubmissions}</strong></span>
                    <span>Max Streak <strong className="text-slate-900 font-bold">{longestStreak}</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Last 84 Days</span>
                </div>

                {/* Heatmap Matrix Grid */}
                <div className="relative pt-1">
                  {hoveredHeatmapDay && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      {hoveredHeatmapDay.count} Solves on {hoveredHeatmapDay.date}
                    </div>
                  )}

                  <div className="grid grid-flow-col grid-rows-7 gap-[3.5px] justify-between">
                    {realHeatmap.length > 0
                      ? realHeatmap.map((d, i) => {
                          let bgClass = 'bg-slate-100';
                          if (d.solvesCount === 1) bgClass = 'bg-emerald-200';
                          else if (d.solvesCount === 2) bgClass = 'bg-emerald-400';
                          else if (d.solvesCount >= 3) bgClass = 'bg-emerald-600';

                          return (
                            <div
                              key={i}
                              onMouseEnter={() => setHoveredHeatmapDay({ date: d.date, count: d.solvesCount })}
                              onMouseLeave={() => setHoveredHeatmapDay(null)}
                              className={`w-[10.5px] h-[10.5px] rounded-[2.5px] ${bgClass} transition-transform hover:scale-125 cursor-pointer`}
                            />
                          );
                        })
                      : Array.from({ length: 84 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-[10.5px] h-[10.5px] rounded-[2.5px] bg-slate-100"
                          />
                        ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5 px-1">
                    <span>12w ago</span>
                    <span>8w ago</span>
                    <span>4w ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contest & Rating Progression Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-title-md font-bold text-slate-900">Rating & Progression</h3>
                  <p className="text-label-xs text-slate-500">Live External Contest Statistics</p>
                </div>
                {cleanCfHandle && (
                  <span className="text-label-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    Codeforces Sync
                  </span>
                )}
              </div>

              {/* Interactive Rating Progression Curve */}
              <div className="border-t border-slate-100 pt-4">
                <RatingCurveChart
                  rating={cfStats?.rating}
                  maxRating={cfStats?.maxRating}
                  rank={cfStats?.rank}
                />
              </div>
            </div>

            {/* Awards & Badges Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-title-md font-bold text-slate-900">Awards & Badges</h3>
                  <p className="text-label-xs text-slate-500">
                    {badgesList.filter(b => b.unlocked).length} of {badgesList.length} Milestones Unlocked
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-start gap-4 overflow-x-auto py-2">
                {badgesList.map(b => (
                  <HexBadge
                    key={b.id}
                    icon={b.icon}
                    title={b.title}
                    subtitle={b.subtitle}
                    unlocked={b.unlocked}
                    color={b.color}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════════
              RIGHT COLUMN: Question Distribution & Contest Rankings
             ══════════════════════════════════════════════════════════════════════ */}
          <motion.div variants={fadeUp} className="lg:col-span-3 space-y-6">
            {/* Question Distribution Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <h3 className="text-title-md font-bold text-slate-900 text-center">
                Question Distribution
              </h3>

              {/* Platform Distribution */}
              <div className="space-y-3">
                <div className="text-label-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  Platform Breakdown
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <DonutChart
                    total={totalSolved}
                    segments={[
                      { value: sqlVerifiedSolves.length, color: '#f97316', label: 'SQLPath' },
                      { value: lcTotal, color: '#eab308', label: 'LeetCode' },
                      { value: gfgTotal, color: '#2F8D46', label: 'GfG' },
                    ]}
                    size={110}
                    strokeWidth={12}
                    centerLabel=""
                  />

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between text-label-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">SQLPath</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{sqlVerifiedSolves.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-label-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">LeetCode</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{lcTotal}</span>
                    </div>

                    {gfgTotal > 0 && (
                      <div className="flex items-center justify-between text-label-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-700 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">GfG</span>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">{gfgTotal}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Difficulty Breakdown */}
              <div className="space-y-3">
                <div className="text-label-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  By Difficulty
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <DonutChart
                    total={totalDiffSolved}
                    segments={[
                      { value: easyCount, color: '#22c55e', label: 'Easy' },
                      { value: mediumCount, color: '#eab308', label: 'Medium' },
                      { value: hardCount, color: '#ef4444', label: 'Hard' },
                    ]}
                    size={110}
                    strokeWidth={12}
                    centerLabel=""
                  />

                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div className="flex items-center justify-between text-label-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">Easy</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{easyCount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-label-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">Medium</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{mediumCount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-label-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">Hard</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{hardCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contest Rankings Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-center">
              <h3 className="text-title-md font-bold text-slate-900">External Contest Standing</h3>

              {cfStats?.rating ? (
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="w-14 h-16 relative flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 120" className="w-full h-full text-blue-100">
                      <path
                        d="M50 5 L90 25 L90 70 C90 95 50 115 50 115 C50 115 10 95 10 70 L10 25 Z"
                        fill="currentColor"
                        stroke="#93c5fd"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-xl">🛡️</span>
                  </div>

                  <div className="text-left min-w-0">
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">
                      {cfStats.rating}
                    </div>
                    <div className="text-label-xs text-slate-400 mt-1 font-medium">
                      (max: {cfStats.maxRating || cfStats.rating})
                    </div>
                    <div className={`text-label-xs font-semibold capitalize mt-1 truncate ${cfRankColor(cfStats.rank)}`}>
                      {cfStats.rank || 'Rated'}
                    </div>
                  </div>
                </div>
              ) : leetcodeStats?.ranking ? (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="text-3xl font-extrabold text-slate-900">
                    #{leetcodeStats.ranking.toLocaleString()}
                  </div>
                  <div className="text-label-xs text-slate-500">
                    LeetCode Global Rank
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <p className="text-body-sm text-slate-500">
                    No contest ratings found yet. Connect your Codeforces or LeetCode handle.
                  </p>
                  <button
                    onClick={() => setConnectModalPlatform('codeforces')}
                    className="text-label-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    Connect Codeforces
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectModalPlatform && (
          <ConnectModal
            platform={connectModalPlatform}
            onClose={() => setConnectModalPlatform(null)}
            token={token || ''}
            onLeetcodeConnect={handleLeetcodeConnect}
            onCfConnect={handleCfConnect}
            onGfgConnect={handleGfgConnect}
            onHrConnect={handleHrConnect}
          />
        )}
      </AnimatePresence>
    </StudentLayout>
  );
}
