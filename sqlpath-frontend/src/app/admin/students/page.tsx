'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { engagementBadge, initials, timeAgo } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active', slipping: 'Slipping', at_risk: 'At Risk',
  dormant: 'Dormant', never_started: 'Never Started',
};

function EngagementChip({ status }: { status: string }) {
  return (
    <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium ${engagementBadge(status)}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function TrustBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-tertiary' : score >= 40 ? 'bg-secondary' : 'bg-error';
  return (
    <div className="flex items-center gap-2 min-w-[72px]">
      <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-label-sm text-on-surface-variant w-6 text-right">{score}</span>
    </div>
  );
}

export default function AdminStudentsPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<'score' | 'solves' | 'streak' | 'name'>('score');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    api.adminGetStudents(token).then(setStudents).finally(() => setLoading(false));
  }, [token, user?.role, authLoading]);

  const sorted = [...students].sort((a, b) => {
    if (sort === 'score') return Number(b.total_score) - Number(a.total_score);
    if (sort === 'solves') return Number(b.total_solves) - Number(a.total_solves);
    if (sort === 'streak') return Number(b.current_streak) - Number(a.current_streak);
    return a.name.localeCompare(b.name);
  });
  const filtered = sorted.filter(s => {
    if (statusFilter && s.engagement_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Summary stats
  const totalActive = students.filter(s => s.engagement_status === 'active').length;
  const atRisk = students.filter(s => ['at_risk', 'never_started'].includes(s.engagement_status)).length;
  const avgSolves = students.length
    ? Math.round(students.reduce((s, st) => s + Number(st.total_solves || 0), 0) / students.length)
    : 0;

  return (
    <AdminLayout>
      <motion.div variants={staggerContainer()} initial="hidden" animate="show"
        className="p-4 md:p-6 space-y-5 max-w-[1200px] w-full">

        {/* Page header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
            <Icon name="group" size={20} filled />
          </div>
          <div>
            <h1 className="text-headline-md text-on-surface">Students</h1>
            <p className="text-label-sm text-on-surface-variant">{students.length} students enrolled</p>
          </div>
        </motion.div>

        {/* Summary mini cards */}
        {!loading && students.length > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 text-tertiary flex items-center justify-center">
                <Icon name="bolt" size={16} />
              </div>
              <div>
                <CountUp value={totalActive} className="text-headline-md font-bold text-on-surface" />
                <p className="text-label-sm text-on-surface-variant">Active</p>
              </div>
            </div>
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-error-container/50 text-error flex items-center justify-center">
                <Icon name="warning" size={16} />
              </div>
              <div>
                <CountUp value={atRisk} className="text-headline-md font-bold text-on-surface" />
                <p className="text-label-sm text-on-surface-variant">At Risk</p>
              </div>
            </div>
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                <Icon name="check_circle" size={16} />
              </div>
              <div>
                <CountUp value={avgSolves} className="text-headline-md font-bold text-on-surface" />
                <p className="text-label-sm text-on-surface-variant">Avg Solves</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
              className="pl-8 pr-3 py-1.5 text-label-md bg-surface border border-outline-variant rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant w-52" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-label-md bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="slipping">Slipping</option>
            <option value="at_risk">At Risk</option>
            <option value="dormant">Dormant</option>
            <option value="never_started">Never Started</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as any)}
            className="text-label-md bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface ml-auto">
            <option value="score">Sort: Score</option>
            <option value="solves">Sort: Solves</option>
            <option value="streak">Sort: Streak</option>
            <option value="name">Sort: Name</option>
          </select>
        </motion.div>

        {/* Table */}
        <motion.div variants={fadeUp} className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-lowest">
                    <th className="text-left py-3 px-4 text-label-sm text-on-surface-variant font-medium">Student</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Status</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Solves</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Score</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Streak</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Trust</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Last Active</th>
                    <th className="py-3 px-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Icon name="group_off" size={32} className="text-on-surface-variant/40 block mx-auto mb-2" />
                        <p className="text-label-md text-on-surface-variant">No students match your filters</p>
                      </td>
                    </tr>
                  ) : filtered.map(s => (
                    <tr key={s.id} className="border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold flex-shrink-0 border border-outline-variant">
                            {initials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-md font-semibold text-on-surface truncate">{s.name}</p>
                            <p className="text-label-sm text-on-surface-variant truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3"><EngagementChip status={s.engagement_status} /></td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-label-md font-bold text-primary">{s.total_solves || 0}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-label-md text-on-surface">
                        {Math.round(Number(s.total_score || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Icon name="local_fire_department" size={13} className={s.current_streak > 0 ? 'text-orange-500' : 'text-on-surface-variant'} />
                          <span className="text-label-md text-on-surface">{s.current_streak}d</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><TrustBar score={s.trust_score} /></td>
                      <td className="py-3 px-3 text-label-sm text-on-surface-variant">{timeAgo(s.last_active_date)}</td>
                      <td className="py-3 px-3">
                        <Link href={`/admin/student/${s.id}`}
                          className="inline-flex items-center gap-1 text-label-sm text-primary hover:underline font-medium">
                          View <Icon name="chevron_right" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="px-4 py-2.5 border-t border-outline-variant bg-surface-container-lowest">
                  <p className="text-label-sm text-on-surface-variant">Showing {filtered.length} of {students.length} students</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
