'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { difficultyBadge, engagementBadge, platformBadge, initials, timeAgo, formatPoints } from '@/lib/utils';

// ── Platform brand SVGs ────────────────────────────────────────────────────────
function LeetCodeLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#FFA116" d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831A5.792 5.792 0 0 0 13.483 0z" />
      <path fill="#5B5B5B" d="M5.009 13.564a1.38 1.38 0 0 1 1.378-1.38h11.226a1.38 1.38 0 0 1 0 2.76H6.387a1.38 1.38 0 0 1-1.378-1.38z" />
    </svg>
  );
}

function CodeforcesLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="1.5" y="9" width="5" height="13" rx="1.5" fill="#FFD400" />
      <rect x="9.5" y="3" width="5" height="19" rx="1.5" fill="#188BF6" />
      <rect x="17.5" y="14" width="5" height="8" rx="1.5" fill="#ED2128" />
    </svg>
  );
}

function GfgLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0F9D58">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5h-2v-9h2v9zm6 0h-2v-5.5a1.5 1.5 0 0 0-3 0v5.5h-2v-9h2v1.5a3.5 3.5 0 0 1 5 3.5v4z" />
    </svg>
  );
}

function HackerRankLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="6" fill="#2EC866" />
      <path d="M7 6h2.5v4.5h5V6H17v12h-2.5v-4.8h-5V18H7V6z" fill="white" />
    </svg>
  );
}

// ── Activity chart ─────────────────────────────────────────────────────────────
function ActivityChart({ data }: { data: any[] }) {
  if (!data.length) return <p className="text-label-sm text-on-surface-variant py-4">No activity in the last 30 days.</p>;
  const max = Math.max(...data.map(d => Number(d.solves_count) || 0), 1);
  return (
    <div className="flex items-end gap-1 h-16 overflow-x-auto">
      {data.map((d, i) => {
        const pct = Math.max((Number(d.solves_count) / max) * 100, 4);
        const date = new Date(d.activity_date);
        return (
          <div key={i} title={`${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${d.solves_count} solve${d.solves_count !== 1 ? 's' : ''}`}
            className="flex flex-col items-center gap-0.5 group flex-shrink-0">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.02, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-4 rounded-t-sm bg-primary/60 group-hover:bg-primary transition-colors"
              style={{ maxHeight: '56px' }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Platform stat card ──────────────────────────────────────────────────────────
function PlatformCard({
  logo, name, username, data, fields, notLinked,
}: {
  logo: React.ReactNode; name: string; username?: string | null;
  data: any; fields: { key: string; label: string }[]; notLinked?: boolean;
}) {
  if (notLinked || !data) {
    return (
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <div className="opacity-60">{logo}</div>
          <p className="text-label-md font-semibold text-on-surface">{name}</p>
          <span className="ml-auto text-label-xs text-on-surface-variant">Not linked</span>
        </div>
        <p className="text-label-sm text-on-surface-variant">Student hasn&apos;t added their {name} profile yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {logo}
        <p className="text-label-md font-semibold text-on-surface">{name}</p>
        {username && (
          <span className="ml-auto text-label-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">@{username}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(f => (
          <div key={f.key} className="bg-surface-container-high rounded-lg p-2.5">
            <p className="text-label-xs text-on-surface-variant">{f.label}</p>
            <p className="text-label-md font-bold text-on-surface mt-0.5">{data[f.key] ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminStudentDetailPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [detail, setDetail] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    if (!studentId) return;
    Promise.all([
      api.adminGetStudentDetail(token, studentId),
      api.adminGetStudentPlatformStats(token, studentId).catch(() => null),
    ]).then(([d, p]) => {
      setDetail(d);
      setPlatformStats(p);
    }).finally(() => setLoading(false));
  }, [token, user?.role, authLoading, studentId]);

  if (loading) return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </AdminLayout>
  );

  if (!detail) return (
    <AdminLayout>
      <div className="p-6 text-on-surface-variant text-label-md flex items-center gap-2">
        <Icon name="error_outline" size={18} /> Student not found.
      </div>
    </AdminLayout>
  );

  const { profile, stats, recentSolves, activityLast30Days } = detail;
  const totalScore = Math.round(Number(stats?.total_score || 0));

  return (
    <AdminLayout>
      <motion.div variants={staggerContainer()} initial="hidden" animate="show"
        className="p-4 md:p-6 space-y-5 max-w-[1100px] w-full">

        {/* Back nav */}
        <motion.div variants={fadeUp}>
          <Link href="/admin/students" className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="arrow_back" size={15} /> Back to Students
          </Link>
        </motion.div>

        {/* Profile hero */}
        <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center text-headline-md font-black flex-shrink-0 border-2 border-outline-variant">
            {initials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-headline-md text-on-surface font-bold">{profile.name}</h1>
              <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium ${engagementBadge(profile.engagement_status)}`}>
                {profile.engagement_status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant mt-0.5">{profile.email}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {profile.leetcode_username && (
                <span className="flex items-center gap-1 text-label-xs text-on-surface-variant">
                  <LeetCodeLogo /> {profile.leetcode_username}
                  {profile.leetcode_verified && <Icon name="verified" size={12} className="text-primary" />}
                </span>
              )}
              {profile.codeforces_username && (
                <span className="flex items-center gap-1 text-label-xs text-on-surface-variant">
                  <CodeforcesLogo /> {profile.codeforces_username}
                </span>
              )}
              {profile.geeksforgeeks_username && (
                <span className="flex items-center gap-1 text-label-xs text-on-surface-variant">
                  <GfgLogo /> {profile.geeksforgeeks_username}
                </span>
              )}
              {profile.hackerrank_username && (
                <span className="flex items-center gap-1 text-label-xs text-on-surface-variant">
                  <HackerRankLogo /> {profile.hackerrank_username}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right flex-shrink-0">
            <p className="text-label-xs text-on-surface-variant">Joined</p>
            <p className="text-label-md text-on-surface">{new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>
            <p className="text-label-xs text-on-surface-variant mt-1">Last Active</p>
            <p className="text-label-md text-on-surface">{timeAgo(profile.last_active_date)}</p>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { icon: 'check_circle', label: 'Solved', value: Number(stats?.solved || 0), color: 'bg-primary-container text-primary' },
            { icon: 'star', label: 'Score', value: totalScore, color: 'bg-secondary-container text-on-secondary-container' },
            { icon: 'local_fire_department', label: 'Streak', value: profile.current_streak, suffix: 'd', color: 'bg-tertiary-container/30 text-tertiary' },
            { icon: 'emoji_events', label: 'Best Streak', value: profile.longest_streak, suffix: 'd', color: 'bg-primary-container text-primary' },
            { icon: 'verified_user', label: 'Trust', value: profile.trust_score, color: profile.trust_score >= 70 ? 'bg-tertiary-container/30 text-tertiary' : 'bg-error-container/50 text-error' },
            { icon: 'quiz', label: 'Opened', value: Number(recentSolves.length || 0), color: 'bg-surface-container-high text-on-surface-variant' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-outline-variant rounded-xl p-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                <Icon name={s.icon} size={15} filled />
              </div>
              <CountUp value={s.value} suffix={s.suffix ?? ''} className="text-title-md font-bold text-on-surface" />
              <p className="text-label-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Difficulty breakdown */}
        <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded-xl p-4">
          <p className="text-label-md font-semibold text-on-surface mb-3">Solved by Difficulty</p>
          <div className="flex gap-6">
            {[
              { label: 'Easy', val: stats?.easy_solved || 0, color: 'text-tertiary', bg: 'bg-tertiary/10' },
              { label: 'Medium', val: stats?.medium_solved || 0, color: 'text-secondary', bg: 'bg-secondary-container/50' },
              { label: 'Hard', val: stats?.hard_solved || 0, color: 'text-error', bg: 'bg-error-container/50' },
            ].map(d => (
              <div key={d.label} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${d.bg}`}>
                <span className={`text-headline-md font-black ${d.color}`}>{d.val}</span>
                <span className="text-label-sm text-on-surface-variant">{d.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity chart */}
        <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-label-md font-semibold text-on-surface">Activity — Last 30 Days</p>
            <span className="text-label-xs text-on-surface-variant">{activityLast30Days.length} active days</span>
          </div>
          <ActivityChart data={activityLast30Days} />
        </motion.div>

        {/* Platform stats */}
        <motion.div variants={fadeUp}>
          <p className="text-label-md font-semibold text-on-surface mb-3">Coding Profiles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PlatformCard
              logo={<LeetCodeLogo className="w-5 h-5" />}
              name="LeetCode"
              username={profile.leetcode_username}
              data={platformStats?.leetcode}
              notLinked={!profile.leetcode_username}
              fields={[
                { key: 'totalSolved', label: 'Total Solved' },
                { key: 'ranking', label: 'Global Rank' },
                { key: 'easySolved', label: 'Easy' },
                { key: 'mediumSolved', label: 'Medium' },
                { key: 'hardSolved', label: 'Hard' },
              ]}
            />
            <PlatformCard
              logo={<CodeforcesLogo className="w-5 h-5" />}
              name="Codeforces"
              username={profile.codeforces_username}
              data={platformStats?.codeforces}
              notLinked={!profile.codeforces_username}
              fields={[
                { key: 'rating', label: 'Rating' },
                { key: 'maxRating', label: 'Max Rating' },
                { key: 'rank', label: 'Rank' },
                { key: 'contribution', label: 'Contribution' },
              ]}
            />
            <PlatformCard
              logo={<GfgLogo className="w-5 h-5" />}
              name="GeeksforGeeks"
              username={profile.geeksforgeeks_username}
              data={platformStats?.geeksforgeeks}
              notLinked={!profile.geeksforgeeks_username}
              fields={[
                { key: 'totalSolved', label: 'Total Solved' },
                { key: 'codingScore', label: 'Coding Score' },
                { key: 'easy', label: 'Easy' },
                { key: 'medium', label: 'Medium' },
              ]}
            />
            <PlatformCard
              logo={<HackerRankLogo className="w-5 h-5" />}
              name="HackerRank"
              username={profile.hackerrank_username}
              data={platformStats?.hackerrank}
              notLinked={!profile.hackerrank_username}
              fields={[
                { key: 'totalBadges', label: 'Badges' },
                { key: 'totalStars', label: 'Stars' },
              ]}
            />
          </div>
        </motion.div>

        {/* Recent solves */}
        <motion.div variants={fadeUp} className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <p className="text-label-md font-semibold text-on-surface">Recent Solves</p>
            <span className="text-label-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{recentSolves.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th className="text-left py-2.5 px-4 text-label-sm text-on-surface-variant font-medium">#</th>
                  <th className="text-left py-2.5 px-3 text-label-sm text-on-surface-variant font-medium">Question</th>
                  <th className="text-left py-2.5 px-3 text-label-sm text-on-surface-variant font-medium">Difficulty</th>
                  <th className="text-center py-2.5 px-3 text-label-sm text-on-surface-variant font-medium">Score</th>
                  <th className="text-left py-2.5 px-3 text-label-sm text-on-surface-variant font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentSolves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Icon name="pending_actions" size={28} className="text-on-surface-variant/40 block mx-auto mb-2" />
                      <p className="text-label-md text-on-surface-variant">No solves yet</p>
                    </td>
                  </tr>
                ) : recentSolves.map((s: any) => (
                  <tr key={s.id} className="border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors">
                    <td className="py-2.5 px-4 text-label-sm text-on-surface-variant">{s.question_number}</td>
                    <td className="py-2.5 px-3">
                      <p className="text-label-md text-on-surface font-medium">{s.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${platformBadge(s.platform)}`}>{s.platform}</span>
                        <span className="text-label-xs text-on-surface-variant">Phase {s.phase}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadge(s.difficulty)}`}>{s.difficulty}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-label-md font-bold text-primary">{formatPoints(Number(s.score_awarded))}</span>
                    </td>
                    <td className="py-2.5 px-3 text-label-sm text-on-surface-variant">
                      {new Date(s.submitted_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
