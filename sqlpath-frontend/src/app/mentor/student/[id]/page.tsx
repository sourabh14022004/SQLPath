'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import MentorLayout from '@/components/MentorLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { engagementBadge, formatPoints, initials, timeAgo } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

export default function StudentDetailPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    api.getStudentDetail(token, params.id as string)
      .then(setData)
      .catch(err => setError(err.message ?? 'Failed to load student'))
      .finally(() => setLoading(false));
  }, [token, params.id, authLoading]);

  if (loading) return (
    <MentorLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-40 rounded" />
      </div>
    </MentorLayout>
  );

  if (error) return (
    <MentorLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3">{error}</div>
      </div>
    </MentorLayout>
  );

  const { profile, recentSolves, flags, trustHistory } = data ?? {};

  return (
    <MentorLayout>
      <motion.div
        className="p-4 md:p-6 max-w-3xl mx-auto space-y-6"
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
      >
        <motion.button
          variants={fadeUp}
          whileHover={{ x: -3 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-label-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" size={16} /> Back
        </motion.button>

        {/* Profile header */}
        <motion.div variants={fadeUp} className="bg-surface border border-outline-variant rounded-lg p-6">
          <div className="flex items-start gap-4 justify-between flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-headline-md text-on-surface-variant font-bold">
                {initials(profile?.name)}
              </div>
              <div>
                <h1 className="text-headline-md text-on-surface">{profile?.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-code text-code text-on-surface-variant">{profile?.email}</span>
                  <span className="text-on-surface-variant text-label-sm">· Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-label-sm font-semibold ${engagementBadge(profile?.engagement_status)}`}>
              {profile?.engagement_status?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-surface-container-low border border-outline-variant rounded p-4">
              <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-2">Trust Score</div>
              <CountUp value={Number(profile?.trust_score ?? 0)} suffix="%" className={`text-headline-lg font-bold ${profile?.trust_score < 50 ? 'text-error' : 'text-on-surface'}`} />
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded p-4">
              <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-2">Current Streak</div>
              <div className="text-headline-lg font-bold text-on-surface"><CountUp value={Number(profile?.current_streak ?? 0)} /><span className="text-body-md font-normal text-on-surface-variant ml-1">days</span></div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded p-4">
              <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-2">Longest Streak</div>
              <div className="text-headline-lg font-bold text-on-surface"><CountUp value={Number(profile?.longest_streak ?? 0)} /><span className="text-body-md font-normal text-on-surface-variant ml-1">days</span></div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded p-4">
              <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-2">Last Active</div>
              <div className="text-headline-md font-bold text-on-surface">{timeAgo(profile?.last_active_date)}</div>
            </div>
          </div>
        </motion.div>

        {/* Anti-gaming flags */}
        {flags?.length > 0 && (
          <motion.section variants={fadeUp} className="border border-error/40 bg-error-container/5 rounded overflow-hidden">
            <div className="bg-error-container/20 px-4 py-3 border-b border-error/20 flex items-center gap-2 text-on-error-container text-label-md font-bold">
              <Icon name="warning" size={18} />
              Active Integrity Flags ({flags.length})
            </div>
            <div className="p-4 flex flex-col gap-3">
              {flags.map((f: any, i: number) => (
                <div key={f.id} className={`flex items-start gap-3 ${i > 0 ? 'border-t border-error/10 pt-3' : ''}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-label-sm text-on-surface font-semibold capitalize">{f.flag_type.replace(/_/g, ' ')}</div>
                    <div className="text-[13px] text-on-surface-variant mt-0.5">{JSON.stringify(f.detail)}</div>
                    <div className="font-code text-[11px] text-on-surface-variant/70 mt-1">{new Date(f.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent solves */}
        <motion.section variants={fadeUp} className="bg-surface border border-outline-variant rounded overflow-hidden">
          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant text-on-surface text-label-md font-semibold">
            Recent Solves
          </div>
          <div className="divide-y divide-outline-variant">
            {recentSolves?.map((s: any) => {
              const verified = s.status === 'mentor_verified' || s.status === 'auto_verified';
              return (
                <div key={s.id} className="p-3 flex justify-between items-center hover:bg-surface-container-lowest transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon name={verified ? 'check_circle' : 'pending'} size={18} className={verified ? 'text-tertiary' : 'text-outline-variant'} />
                    <div>
                      <div className="font-code text-[12px] text-on-surface font-semibold">{s.title}</div>
                      <div className="text-label-sm text-[11px] text-on-surface-variant mt-0.5 capitalize">{s.difficulty} · {formatPoints(s.score_awarded)} pts</div>
                    </div>
                  </div>
                  <div className="font-code text-[11px] text-on-surface-variant">{timeAgo(s.submitted_at)}</div>
                </div>
              );
            })}
            {!recentSolves?.length && <p className="text-on-surface-variant text-body-md p-4">No solves yet</p>}
          </div>
        </motion.section>

        {/* Trust history */}
        <motion.section variants={fadeUp} className="bg-surface border border-outline-variant rounded overflow-hidden">
          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant text-on-surface text-label-md font-semibold">
            Trust Score History
          </div>
          <div className="divide-y divide-outline-variant">
            {trustHistory?.map((t: any) => (
              <div key={t.id} className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-body-md text-on-surface capitalize">{t.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-label-sm text-on-surface-variant">{t.reason}</p>
                </div>
                <span className={`font-code text-code font-semibold ${t.delta > 0 ? 'text-tertiary' : 'text-error'}`}>
                  {t.delta > 0 ? '+' : ''}{t.delta}
                </span>
              </div>
            ))}
            {!trustHistory?.length && <p className="text-on-surface-variant text-body-md p-4">No trust events yet</p>}
          </div>
        </motion.section>
      </motion.div>
    </MentorLayout>
  );
}
