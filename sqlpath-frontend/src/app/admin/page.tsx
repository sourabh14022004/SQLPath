'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { difficultyBadge, platformBadge } from '@/lib/utils';

// ── Activity Bar Chart (Continuous 14-Day Timeline) ──────────────────────────
function ActivityChart({ data }: { data: any[] }) {
  const dataMap: Record<string, { solves: number; students: number }> = {};
  let totalSolves14 = 0;
  let maxSolves = 1;

  (data || []).forEach(d => {
    if (d.activity_date) {
      const dStr = new Date(d.activity_date).toISOString().split('T')[0];
      const solves = Number(d.total_solves) || 0;
      const students = Number(d.active_students) || 0;
      dataMap[dStr] = { solves, students };
      totalSolves14 += solves;
      if (solves > maxSolves) maxSolves = solves;
    }
  });

  const days: { date: Date; dateStr: string; label: string; solves: number; students: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const item = dataMap[dStr] || { solves: 0, students: 0 };
    days.push({
      date: d,
      dateStr: dStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      solves: item.solves,
      students: item.students,
    });
  }

  return (
    <div className="space-y-3">
      {/* 14-day bar grid spanning full width */}
      <div
        className="gap-1.5 sm:gap-2 items-end h-28 pt-4 pb-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
      >
        {days.map((d, i) => {
          const heightPct = d.solves > 0 ? Math.max(20, Math.round((d.solves / maxSolves) * 100)) : 8;
          const isToday = i === 13;

          return (
            <div key={d.dateStr} className="flex flex-col items-center gap-1.5 h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#261E18] text-[#FFFDF9] text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap z-20">
                {d.label}: {d.solves} solves ({d.students} students)
              </div>

              {/* Solve count pill on top of active bar */}
              {d.solves > 0 ? (
                <span className="text-[10px] font-extrabold text-primary mb-0.5 leading-none">
                  {d.solves}
                </span>
              ) : (
                <span className="text-[10px] text-transparent mb-0.5 leading-none select-none">0</span>
              )}

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
                className={`w-full max-w-[28px] rounded-t-md transition-all ${
                  d.solves > 0
                    ? 'bg-primary group-hover:bg-primary/80 shadow-xs'
                    : 'bg-surface-container-high group-hover:bg-outline-variant/60'
                }`}
              />

              {/* Day label */}
              <span className={`text-[9px] text-center font-medium leading-tight truncate max-w-full ${
                isToday ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}>
                {d.date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/40">
        <span>14 days ago ({days[0]?.label})</span>
        <span className="font-semibold text-on-surface">Total: {totalSolves14} solves across 14 days</span>
        <span>Today ({days[13]?.label})</span>
      </div>
    </div>
  );
}

// ── Heatmap cell color ──────────────────────────────────────────────────────────
function solveRateColor(rate: number | null, opens: number): string {
  if (!opens) return 'bg-surface-container-high text-on-surface-variant';
  if (rate === null || rate === 0) return 'bg-error/10 text-error';
  if (rate < 30) return 'bg-orange-500/10 text-orange-700';
  if (rate < 60) return 'bg-yellow-400/10 text-yellow-700';
  return 'bg-tertiary/10 text-tertiary';
}

// ── Stat card ───────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, decimals = 0, suffix = '', color,
}: {
  icon: string; label: string; value: number; decimals?: number;
  suffix?: string; color: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div>
        <CountUp value={value} decimals={decimals} suffix={suffix} className="text-headline-md text-on-surface font-bold" />
        <p className="text-label-sm text-on-surface-variant mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    Promise.all([api.adminGetStats(token), api.adminGetHeatmap(token)])
      .then(([s, h]) => { setStats(s); setHeatmap(h); })
      .finally(() => setLoading(false));
  }, [token, user?.role, authLoading]);

  const phases = [...new Set(heatmap.map(q => q.phase))].sort((a, b) => Number(a) - Number(b));
  const filtered = heatmap.filter(q => {
    if (diffFilter && q.difficulty !== diffFilter) return false;
    if (phaseFilter && String(q.phase) !== phaseFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.title.toLowerCase().includes(s) && !q.topic?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const ov = stats?.overview;

  if (loading) return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="md:col-span-2 h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 space-y-5 max-w-[1400px] w-full"
      >
        {/* Page header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
            <Icon name="dashboard" size={20} filled />
          </div>
          <div>
            <h1 className="text-headline-md text-on-surface">Dashboard</h1>
            <p className="text-label-sm text-on-surface-variant">Platform overview & question analytics</p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon="group" label="Total Students" value={Number(ov?.total_students || 0)} color="bg-secondary-container text-on-secondary-container" />
          <StatCard icon="quiz" label="Active Questions" value={Number(ov?.total_questions || 0)} color="bg-primary-container text-primary" />
          <StatCard icon="check_circle" label="Total Solves" value={Number(ov?.total_solves || 0)} color="bg-tertiary-container text-on-tertiary-container" />
          <StatCard icon="bolt" label="Active Today" value={Number(ov?.active_today || 0)} color="bg-secondary-container text-on-secondary-container" />
          <StatCard icon="star" label="Points Today" value={Math.round(Number(ov?.points_today || 0))} color="bg-primary-container text-primary" />
        </div>

        {/* Activity + Difficulty breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 14-day activity */}
          <motion.div variants={fadeUp} className="md:col-span-2 bg-surface border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-label-md font-bold text-on-surface">14-Day Solve Activity</p>
                <p className="text-[11px] text-on-surface-variant">Daily student problem submissions over the last 14 days</p>
              </div>
            </div>
            <ActivityChart data={stats?.last14Days ?? []} />
          </motion.div>

          {/* By difficulty */}
          <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded-xl p-4">
            <p className="text-label-md font-semibold text-on-surface mb-3">By Difficulty</p>
            <div className="space-y-2.5">
              {(stats?.byDifficulty ?? []).map((d: any) => {
                const total = Number(d.total) || 1;
                const solves = Number(d.solves) || 0;
                const pct = Math.round((solves / total) * 100);
                const colors: Record<string, string> = {
                  easy: 'bg-tertiary',
                  medium: 'bg-secondary',
                  hard: 'bg-error',
                };
                return (
                  <div key={d.difficulty}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-label-xs px-2 py-0.5 rounded-full font-semibold capitalize ${difficultyBadge(d.difficulty)}`}>{d.difficulty}</span>
                      <span className="text-label-sm text-on-surface-variant">{solves}/{d.total} solves</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${colors[d.difficulty] ?? 'bg-primary'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Question Heatmap */}
        <motion.div variants={fadeUp} className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Question Heatmap</h2>
              <p className="text-label-sm text-on-surface-variant">{filtered.length} of {heatmap.length} questions</p>
            </div>
            <div className="sm:ml-auto flex flex-wrap gap-2">
              <div className="relative">
                <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 text-label-md bg-surface-container-high border border-outline-variant rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant w-40"
                />
              </div>
              <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
                className="text-label-md bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface">
                <option value="">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}
                className="text-label-md bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface">
                <option value="">All Phases</option>
                {phases.map(p => <option key={p} value={String(p)}>Phase {p}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  {['#', 'Question', 'Platform', 'Diff', 'Opens', 'Solved', 'Open≠Solved', 'Solve Rate'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-label-sm text-on-surface-variant font-medium first:w-10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Icon name="search_off" size={32} className="text-on-surface-variant/40 block mx-auto mb-2" />
                      <p className="text-label-md text-on-surface-variant">No questions match your filters</p>
                    </td>
                  </tr>
                ) : filtered.map(q => {
                  const opens = Number(q.total_opens) || 0;
                  const solved = Number(q.solved_count) || 0;
                  const openNotSolved = Number(q.opened_not_solved) || 0;
                  const rate = q.solve_rate ? Number(q.solve_rate) : null;
                  const pct = rate ?? (opens > 0 ? Math.round((solved / opens) * 100) : 0);
                  return (
                    <tr key={q.id} className={`border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors ${!q.is_active ? 'opacity-40' : ''}`}>
                      <td className="py-2.5 px-3 text-label-sm text-on-surface-variant">{q.number}</td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <p className="text-label-md text-on-surface font-medium truncate">{q.title}</p>
                        <p className="text-label-sm text-on-surface-variant truncate">{q.topic}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium capitalize ${platformBadge(q.platform)}`}>{q.platform}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                      </td>
                      <td className="py-2.5 px-3 text-label-md text-on-surface text-center">{opens}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-label-md font-semibold text-primary">{solved}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-label-md text-on-surface-variant">{openNotSolved}</td>
                      <td className="py-2.5 px-3 w-36">
                        {opens === 0 ? (
                          <span className="text-label-sm text-on-surface-variant">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-label-xs px-1.5 py-0.5 rounded-md font-semibold ${solveRateColor(rate, opens)}`}>
                              {pct}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
