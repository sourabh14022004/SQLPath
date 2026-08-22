'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Skeleton from '@/components/Skeleton';
import CountUp from '@/components/CountUp';
import { formatPoints, initials } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

type BoardType = 'alltime' | 'weekly' | 'cohort';

const RANK_BADGE = [
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-slate-100 text-slate-700 border-slate-200',
  'bg-orange-100 text-orange-800 border-orange-200',
];

export default function LeaderboardPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [board, setBoard] = useState<any[]>([]);
  const [type, setType] = useState<BoardType>('alltime');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }
    setLoading(true);
    api.getLeaderboard(token, type)
      .then(setBoard)
      .catch(err => setError(err.message ?? 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [token, type, authLoading, user?.role]);

  const tabs: { key: BoardType; label: string }[] = [
    { key: 'alltime', label: 'All Time' },
    { key: 'weekly', label: 'This Week' },
    { key: 'cohort', label: 'My Cohort' },
  ];

  return (
    <StudentLayout>
      <main className="pb-12 px-4 md:px-6 py-8 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4"
        >
          <div>
            <h1 className="text-display text-on-surface mb-2">Leaderboard</h1>
            <p className="text-body-md text-on-surface-variant">Global rankings based on problem-solving speed and accuracy.</p>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded border border-outline-variant">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`relative px-4 py-1.5 text-label-sm rounded transition-colors ${
                  type === t.key ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {type === t.key && (
                  <motion.div
                    layoutId="leaderboard-tab-active"
                    className="absolute inset-0 bg-surface-container-lowest border border-outline-variant rounded shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {error ? (
          <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3">{error}</div>
        ) : loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded" />)}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-label-md text-on-surface-variant uppercase tracking-wider">
                    <th className="px-4 py-3 w-16 text-center">Rank</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Solves</th>
                    <th className="px-4 py-3 text-right">Streak</th>
                    <th className="px-4 py-3 text-right">Trust Score</th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody
                    key={type}
                    className="text-body-md text-on-surface"
                    variants={staggerContainer(0.03)}
                    initial="hidden"
                    animate="show"
                  >
                    {board.map((row, i) => {
                      const isMe = row.id === user?.id;
                      return (
                        <motion.tr
                          key={row.id}
                          variants={fadeUp}
                          className={`border-b border-outline-variant/50 hover:bg-surface-bright transition-colors ${
                            isMe ? 'border-b-2 !border-primary bg-primary-container/20 hover:bg-primary-container/30' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            {i < 3 ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 + i * 0.05 }}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold border ${RANK_BADGE[i]}`}
                              >
                                {row.rank}
                              </motion.span>
                            ) : (
                              <span className="font-code text-code text-on-surface-variant">{row.rank}</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                isMe ? 'bg-primary-container text-on-primary-container border-2 border-primary' : 'bg-surface-container-highest text-on-surface-variant'
                              }`}>
                                {initials(row.name)}
                              </div>
                              <div>
                                <div className={isMe ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}>
                                  {row.name} {isMe && '(You)'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    row.engagement_status === 'active' ? 'bg-tertiary' :
                                    row.engagement_status === 'slipping' ? 'bg-secondary' :
                                    row.engagement_status === 'at_risk' ? 'bg-error' :
                                    'bg-outline-variant'
                                  }`} />
                                  <span className="text-label-sm text-on-surface-variant capitalize">{row.engagement_status?.replace('_', ' ')}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-4 text-right font-code text-code text-primary ${isMe ? 'font-bold' : 'font-medium'}`}>
                            <CountUp value={Number(row.total_score ?? row.weekly_score ?? 0)} decimals={1} duration={0.7} />
                          </td>
                          <td className="px-4 py-4 text-right font-code text-code">
                            {row.verified_solves ?? row.weekly_solves ?? 0}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center gap-1 font-code text-code">
                              {Number(row.current_streak) > 0 && <span className="text-orange-500 text-lg leading-none">🔥</span>}
                              {row.current_streak}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-code text-code text-tertiary">{row.trust_score}%</td>
                        </motion.tr>
                      );
                    })}
                    {board.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-on-surface-variant">No data yet</td>
                      </tr>
                    )}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>
            <div className="bg-surface border-t border-outline-variant px-4 py-3 flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant">Showing top {board.length} students</span>
            </div>
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
