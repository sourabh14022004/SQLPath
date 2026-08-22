'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import { MotionLink } from '@/components/MotionLink';
import { difficultyBadge, platformBadge } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

const PHASES = [
  'Basics & Filtering',
  'String, Date & CASE',
  'Aggregation & Grouping',
  'Joins',
  'Subqueries & Set Operations',
  'Window Functions',
  'CTEs & Recursion',
  'Interview Case Studies',
];

export default function RoadmapPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [solves, setSolves] = useState<Record<string, any>>({});
  const [activePhase, setActivePhase] = useState(1);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }
    Promise.all([
      api.getQuestions(token),
      api.getMySolves(token),
    ]).then(([qs, sv]) => {
      setQuestions(qs);
      const solveMap: Record<string, any> = {};
      sv.forEach((s: any) => { solveMap[s.questionId] = s; });
      setSolves(solveMap);
    }).catch(err => setError(err.message ?? 'Failed to load roadmap'))
      .finally(() => setLoading(false));
  }, [token, authLoading, user?.role]);

  const phaseQuestions = questions.filter(q => q.phase === activePhase);
  const phasePlatforms = [...new Set(phaseQuestions.map(q => q.platform))].sort();
  const filteredQuestions = platformFilter
    ? phaseQuestions.filter(q => q.platform === platformFilter)
    : phaseQuestions;
  const solvedCount = phaseQuestions.filter(q =>
    solves[q.id]?.status === 'mentor_verified' || solves[q.id]?.status === 'auto_verified'
  ).length;

  if (loading) return (
    <StudentLayout>
      <div className="px-4 md:px-6 py-8 max-w-[1440px] mx-auto space-y-6">
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 rounded-lg" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[68px] rounded" />)}
        </div>
      </div>
    </StudentLayout>
  );

  if (error) return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3">{error}</div>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <main className="px-4 md:px-6 py-8 max-w-[1440px] mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-display text-on-surface"
        >
          SQL Roadmap — 350 Questions
        </motion.h1>

        {/* Phase tabs */}
        <div className="border-b border-outline-variant">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
            {PHASES.map((name, i) => {
              const phase = i + 1;
              const total = questions.filter(q => q.phase === phase).length;
              const done = questions.filter(q =>
                q.phase === phase && (solves[q.id]?.status === 'mentor_verified' || solves[q.id]?.status === 'auto_verified')
              ).length;
              const active = activePhase === phase;
              return (
                <button
                  key={phase}
                  onClick={() => { setActivePhase(phase); setPlatformFilter(null); }}
                  className={`relative flex-shrink-0 px-4 py-2 rounded-t text-label-md flex items-center gap-2 transition-colors ${
                    active ? 'text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="phase-tab-active"
                      className="absolute inset-0 bg-secondary-container rounded-t border-b-2 border-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{phase}. {name}</span>
                  <span className={`relative text-label-sm ${active ? 'text-primary' : 'opacity-70'}`}>{done}/{total}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase header */}
        <motion.div
          layout
          className="bg-surface rounded-lg border border-outline-variant p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-headline-lg text-on-surface mb-1">Phase {activePhase}: {PHASES[activePhase - 1]}</h2>
              <p className="text-body-md text-on-surface-variant">
                {phaseQuestions.length ? `${solvedCount} of ${phaseQuestions.length} completed` : 'No questions in this phase yet.'}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-label-sm mb-1 text-on-surface-variant">
              <span>Progress</span>
              <span className="text-primary font-bold">
                {phaseQuestions.length ? Math.round((solvedCount / phaseQuestions.length) * 100) : 0}% ({solvedCount}/{phaseQuestions.length})
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${phaseQuestions.length ? (solvedCount / phaseQuestions.length) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.div>

        {/* Platform filter */}
        {phasePlatforms.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Platform:</span>
            <button
              onClick={() => setPlatformFilter(null)}
              className={`px-3 py-1 rounded-full text-label-sm border transition-colors ${
                platformFilter === null
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
              }`}
            >
              All ({phaseQuestions.length})
            </button>
            {phasePlatforms.map(p => {
              const count = phaseQuestions.filter(q => q.platform === p).length;
              const active = platformFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(active ? null : p)}
                  className={`px-3 py-1 rounded-full text-label-sm border capitalize transition-colors ${
                    active
                      ? `${platformBadge(p)} font-bold`
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  {p} ({count})
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Questions list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activePhase}-${platformFilter ?? 'all'}`}
            className="space-y-2"
            variants={staggerContainer(0.04)}
            initial="hidden"
            animate="show"
          >
            {filteredQuestions.map(q => {
              const solve = solves[q.id];
              const isDone = solve?.status === 'mentor_verified' || solve?.status === 'auto_verified';
              const isPending = solve?.status === 'pending_review' || solve?.status === 'pending';
              return (
                <MotionLink
                  key={q.id}
                  href={`/roadmap/${q.id}`}
                  variants={fadeUp}
                  whileHover={{ x: 4 }}
                  className={`relative flex items-center justify-between gap-4 rounded border p-4 transition-colors group ${
                    isDone ? 'bg-tertiary/5 border-tertiary/30 hover:bg-tertiary/10'
                    : isPending ? 'bg-surface border-primary overflow-hidden'
                    : 'bg-surface border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  {isPending && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <div className="flex items-center gap-4 pl-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      isDone ? 'bg-tertiary text-on-tertiary border-tertiary-container'
                      : isPending ? 'bg-surface-container-high text-primary border-primary/30'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant'
                    }`}>
                      {isDone ? <Icon name="check" filled size={16} />
                        : isPending ? <Icon name="hourglass_empty" size={16} />
                        : <span className="text-label-sm font-bold">{q.number}</span>}
                    </div>
                    <div>
                      <h3 className="text-label-md text-on-surface">{q.title}</h3>
                      <p className="font-code text-code text-on-surface-variant mt-0.5">{q.topic} · ~{q.estimatedMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${difficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${platformBadge(q.platform)}`}>{q.platform}</span>
                    <span className="text-label-sm text-on-surface-variant whitespace-nowrap min-w-[50px] text-right">{q.basePoints}pts</span>
                  </div>
                </MotionLink>
              );
            })}
            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                {platformFilter ? `No ${platformFilter} questions in this phase.` : 'No questions in this phase yet.'}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </StudentLayout>
  );
}
