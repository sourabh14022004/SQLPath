'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import MentorLayout from '@/components/MentorLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { engagementBadge, formatPoints, initials, timeAgo } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

const STATUS_LABEL: Record<string, string> = {
  never_started: 'Never Started',
  dormant: 'Dormant',
  slipping: 'Slipping',
  at_risk: 'At Risk',
  active: 'Active',
};

export default function CohortRiskPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role === 'student') { router.replace('/dashboard'); return; }
    api.getCohortRisk(token)
      .then(setStudents)
      .catch(err => setError(err.message ?? 'Failed to load cohort risk'))
      .finally(() => setLoading(false));
  }, [token, user?.role, authLoading]);

  if (loading) return (
    <MentorLayout>
      <div className="p-4 md:p-6 max-w-[1440px] mx-auto w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded" />)}
        </div>
        <Skeleton className="h-96 rounded" />
      </div>
    </MentorLayout>
  );

  const atRiskCount = students.filter(s => s.engagement_status === 'at_risk' || s.engagement_status === 'never_started').length;
  const totalFlags = students.reduce((sum, s) => sum + Number(s.total_flags ?? 0), 0);
  const avgTrust = students.length ? Math.round(students.reduce((sum, s) => sum + Number(s.trust_score ?? 0), 0) / students.length) : 0;

  return (
    <MentorLayout>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-4 md:px-6 py-6 border-b border-outline-variant bg-surface"
      >
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg text-on-surface">Cohort Risk Dashboard</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Students sorted riskiest first. Monitor engagement and flag potential academic integrity issues.</p>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-[1440px] mx-auto">
          {error && (
            <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3 mb-6">{error}</div>
          )}

          {!error && students.length > 0 && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded p-4">
                <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-1">Cohort Size</div>
                <CountUp value={students.length} className="text-headline-lg text-on-surface font-bold" />
              </motion.div>
              <motion.div variants={fadeUp} className="bg-surface border border-error/20 rounded p-4">
                <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-1">At Risk</div>
                <CountUp value={atRiskCount} className="text-headline-lg text-error font-bold" />
              </motion.div>
              <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded p-4">
                <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-1">Active Flags</div>
                <CountUp value={totalFlags} className="text-headline-lg text-on-surface font-bold" />
              </motion.div>
              <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded p-4">
                <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-1">Avg Trust</div>
                <CountUp value={avgTrust} suffix="%" className="text-headline-lg text-on-surface font-bold" />
              </motion.div>
            </motion.div>
          )}

          {!error && (
            <div className="bg-surface border border-outline-variant rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold">Student</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold">Status</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold">Last Active</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold text-right">Score</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold text-right">Verified</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold text-center">Flags</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold text-right">Trust</th>
                      <th className="px-4 py-3 text-label-md text-on-surface-variant font-semibold text-right">Streak</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    className="text-body-md divide-y divide-outline-variant"
                    variants={staggerContainer(0.02)}
                    initial="hidden"
                    animate="show"
                  >
                    {students.map(s => (
                      <motion.tr
                        key={s.id}
                        variants={fadeUp}
                        onClick={() => router.push(`/mentor/student/${s.id}`)}
                        className={`cursor-pointer hover:bg-surface-container-low transition-colors ${
                          s.engagement_status === 'never_started' || Number(s.total_flags) > 0 ? 'bg-error-container/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-label-md text-on-surface-variant font-bold">
                              {initials(s.name)}
                            </div>
                            <div>
                              <div className="text-on-surface text-[14px]">{s.name}</div>
                              <div className="font-code text-code text-on-surface-variant text-[11px]">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${engagementBadge(s.engagement_status)}`}>
                            {STATUS_LABEL[s.engagement_status] ?? s.engagement_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant font-code text-code">{timeAgo(s.last_active_date)}</td>
                        <td className="px-4 py-3 text-right font-code text-code">{formatPoints(s.total_score)}</td>
                        <td className="px-4 py-3 text-right font-code text-code">{s.verified_solves}</td>
                        <td className="px-4 py-3 text-center">
                          {Number(s.total_flags) > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2 py-0.5 rounded">
                              <Icon name="warning" size={14} />
                              <span className="font-code text-[12px] font-bold">{s.total_flags}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant text-[12px] font-code">-</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-code text-code ${s.trust_score < 50 ? 'text-error font-bold' : ''}`}>{s.trust_score}%</td>
                        <td className="px-4 py-3 text-right font-code text-code text-on-surface-variant">{s.current_streak}</td>
                      </motion.tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-on-surface-variant">No students in cohort yet</td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </MentorLayout>
  );
}
