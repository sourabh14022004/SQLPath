'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/Icon';
import CountUp from '@/components/CountUp';
import Skeleton from '@/components/Skeleton';
import { MotionLink } from '@/components/MotionLink';
import { engagementBadge, formatPoints, timeAgo } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';
import Link from 'next/link';

const STAT_ICONS = ['🏆', '🔥', '⚡', '🛡️'];

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [engagement, setEngagement] = useState<any>(null);
  const [nextQ, setNextQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }
    Promise.all([
      api.getEngagement(token),
      api.getNextQuestion(token),
    ]).then(([eng, next]) => {
      setEngagement(eng);
      setNextQ(next);
    }).catch(err => setError(err.message ?? 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [token, authLoading, user?.role]);

  if (loading) return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />
      <main className="pt-24 px-4 md:px-6 pb-12 max-w-[1440px] mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-72 mb-3" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-52 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </main>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4">
        <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3">
          {error}
        </div>
      </div>
    </div>
  );

  const heatmap: any[] = engagement?.heatmap ?? [];
  const lastActive = heatmap.filter(d => d.solvesCount > 0).slice(-1)[0];
  const trustScore = user?.trustScore ?? 80;

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-surface-container-high';
    if (count === 1) return 'bg-primary/20';
    if (count <= 3) return 'bg-primary/60';
    return 'bg-primary';
  };

  const stats = [
    { label: 'Total Score', icon: STAT_ICONS[0], value: <CountUp value={Number(engagement?.totalScore ?? 0)} decimals={1} className="text-headline-lg text-on-surface" /> },
    { label: 'Current Streak', icon: STAT_ICONS[1], value: <><CountUp value={engagement?.currentStreak ?? 0} className="text-headline-lg text-on-surface" /> <span className="text-body-md text-on-surface-variant ml-1">days</span></> },
    { label: 'Longest Streak', icon: STAT_ICONS[2], value: <><CountUp value={engagement?.longestStreak ?? 0} className="text-headline-lg text-on-surface" /> <span className="text-body-md text-on-surface-variant ml-1">days</span></> },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />
      <main className="pt-24 px-4 md:px-6 pb-12 max-w-[1440px] mx-auto space-y-8">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-display text-on-surface mb-2">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-label-sm border ${engagementBadge(engagement?.engagementStatus)}`}>
                <motion.span
                  className="w-2 h-2 rounded-full bg-current"
                  animate={engagement?.engagementStatus === 'active' ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                />
                {engagement?.engagementStatus?.replace('_', ' ')}
              </span>
              {lastActive && (
                <span className="text-body-md text-on-surface-variant">Last solved {timeAgo(lastActive.date)}</span>
              )}
            </div>
          </div>
        </motion.header>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
        >
          {stats.map(stat => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg flex flex-col transition-shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-label-md text-on-surface-variant">{stat.label}</span>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <span>{stat.value}</span>
            </motion.div>
          ))}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2 }}
            className="bg-surface-container-lowest border border-outline-variant p-5 rounded-lg flex flex-col transition-shadow hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-label-md text-on-surface-variant">Trust Score</span>
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="flex items-baseline gap-2">
              <CountUp value={trustScore} suffix="%" className="text-headline-lg text-on-surface" />
            </div>
            <div className="w-full bg-surface-container-high h-1 mt-3 rounded-full overflow-hidden">
              <motion.div
                className="bg-tertiary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${trustScore}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {nextQ && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-primary border border-primary/20 rounded-lg p-6 text-on-primary relative overflow-hidden shadow-lg shadow-primary/10"
              >
                <motion.div
                  className="absolute right-[-20%] top-[-50%] w-64 h-64 bg-white/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                />
                <div className="relative z-10">
                  <span className="inline-flex items-center text-label-sm bg-white/20 px-2 py-1 rounded text-white mb-4 uppercase tracking-wider">
                    Recommended Next
                  </span>
                  <h2 className="text-headline-md text-white mb-2">#{nextQ.number} {nextQ.title}</h2>
                  <p className="text-body-md text-white/90 mb-6 max-w-lg">{nextQ.topic}</p>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-1 text-label-sm bg-black/20 px-2.5 py-1 rounded text-white border border-white/10">
                      <Icon name="map" size={16} /> Phase {nextQ.phase}
                    </div>
                    <div className="flex items-center gap-1 text-label-sm bg-black/20 px-2.5 py-1 rounded text-white border border-white/10 capitalize">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" /> {nextQ.difficulty}
                    </div>
                    <div className="flex items-center gap-1 text-label-sm bg-black/20 px-2.5 py-1 rounded text-white border border-white/10">
                      <Icon name="timer" size={16} /> {nextQ.estimatedMinutes} min
                    </div>
                    <div className="flex items-center gap-1 text-label-sm bg-black/20 px-2.5 py-1 rounded text-white border border-white/10 capitalize">
                      <Icon name="dataset" size={16} /> {nextQ.platform}
                    </div>
                  </div>
                  <MotionLink
                    href={`/roadmap/${nextQ.id}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 bg-white text-primary text-label-md px-5 py-2.5 rounded-lg shadow hover:bg-surface-container-low transition-colors"
                  >
                    Start this question
                    <Icon name="arrow_forward" size={18} />
                  </MotionLink>
                </div>
              </motion.div>
            )}

            {/* Activity heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-headline-md text-on-surface">Activity</h3>
                <span className="text-label-sm text-on-surface-variant">Last 12 weeks</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <motion.div
                  className="grid grid-rows-7 grid-flow-col gap-1 w-fit"
                  variants={staggerContainer(0.004)}
                  initial="hidden"
                  animate="show"
                >
                  {heatmap.map((day: any) => (
                    <motion.div
                      key={day.date}
                      variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1 } }}
                      title={`${day.date}: ${day.solvesCount} solves`}
                      className={`w-3.5 h-3.5 rounded-sm border border-outline-variant/30 ${getHeatColor(day.solvesCount)}`}
                    />
                  ))}
                </motion.div>
              </div>
              <div className="flex justify-end items-center gap-2 mt-3 text-label-sm text-on-surface-variant">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-surface-container-high border border-outline-variant/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/30 border border-outline-variant/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/60 border border-outline-variant/30" />
                <div className="w-3 h-3 rounded-sm bg-primary border border-outline-variant/30" />
                <span>More</span>
              </div>
            </motion.div>
          </div>

          {/* Right column: Recent Solves */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col h-full">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center rounded-t-lg">
                <h3 className="text-headline-md text-on-surface" style={{ fontSize: 16 }}>Recent Solves</h3>
                <Link href="/roadmap" className="text-label-sm text-primary hover:underline">View All</Link>
              </div>
              <motion.div
                className="flex flex-col p-2 gap-1 flex-grow"
                variants={staggerContainer(0.05, 0.1)}
                initial="hidden"
                animate="show"
              >
                {(engagement?.recentSolves ?? []).map((s: any, i: number) => {
                  const verified = s.status === 'mentor_verified' || s.status === 'auto_verified';
                  const pending = s.status === 'pending_review' || s.status === 'pending';
                  return (
                    <motion.div key={s.id} variants={fadeUp}>
                      {i > 0 && <hr className="border-t border-outline-variant mx-2" />}
                      <div className="flex flex-col p-3 rounded-lg hover:bg-surface-container transition-colors">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="text-label-md text-on-surface font-semibold">{s.title}</span>
                          {verified ? (
                            <span className="inline-flex items-center gap-1 text-label-sm text-tertiary-container bg-tertiary px-1.5 py-0.5 rounded-md whitespace-nowrap">
                              <Icon name="check_circle" size={14} /> Verified
                            </span>
                          ) : pending ? (
                            <span className="inline-flex items-center gap-1 text-label-sm text-secondary bg-secondary-container px-1.5 py-0.5 rounded-md whitespace-nowrap">
                              <Icon name="hourglass_empty" size={14} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-label-sm text-on-error-container bg-error-container px-1.5 py-0.5 rounded-md whitespace-nowrap">
                              Rejected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-code text-code text-on-surface-variant">
                          <span className="capitalize">{s.difficulty}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>{timeAgo(s.submitted_at)}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>+{formatPoints(s.score_awarded)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {!(engagement?.recentSolves ?? []).length && (
                  <p className="text-body-md text-on-surface-variant p-3">No solves yet.</p>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
