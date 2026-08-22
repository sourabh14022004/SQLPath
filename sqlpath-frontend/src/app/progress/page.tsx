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

const PHASE_DETAILS = [
  {
    phase: 1,
    name: 'Phase 1: Basics & Filtering',
    desc: 'Master the foundation of SQL: SELECT, WHERE filters, logical operators, pattern matching with LIKE, sorting with ORDER BY, and LIMIT.',
    topics: ['SELECT', 'WHERE', 'AND / OR', 'LIKE', 'IN / BETWEEN', 'ORDER BY', 'LIMIT'],
  },
  {
    phase: 2,
    name: 'Phase 2: String, Date & CASE',
    desc: 'Manipulate text strings, parse timestamps, format dates, and implement conditional branching logic using CASE WHEN expressions.',
    topics: ['CONCAT', 'SUBSTRING', 'DATE_ADD', 'DATEDIFF', 'CASE WHEN', 'COALESCE', 'ROUND'],
  },
  {
    phase: 3,
    name: 'Phase 3: Aggregation & Grouping',
    desc: 'Summarize datasets with aggregate functions, group rows with GROUP BY, and filter grouped metrics with HAVING clauses.',
    topics: ['COUNT', 'SUM / AVG', 'MIN / MAX', 'GROUP BY', 'HAVING', 'DISTINCT'],
  },
  {
    phase: 4,
    name: 'Phase 4: Joins & Relational Data',
    desc: 'Combine relational tables with INNER, LEFT, RIGHT, and FULL OUTER joins, multiple table joins, and self-referencing joins.',
    topics: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'SELF JOIN', 'CROSS JOIN', 'ON conditions'],
  },
  {
    phase: 5,
    name: 'Phase 5: Subqueries & Set Operations',
    desc: 'Write nested subqueries in WHERE, FROM, and SELECT clauses, correlated subqueries, and combine result sets using UNION and INTERSECT.',
    topics: ['Subqueries', 'Correlated Subqueries', 'EXISTS / NOT EXISTS', 'UNION', 'UNION ALL'],
  },
  {
    phase: 6,
    name: 'Phase 6: Window Functions',
    desc: 'Perform advanced analytical queries with ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG, and sliding window aggregations.',
    topics: ['ROW_NUMBER()', 'RANK() / DENSE_RANK()', 'LEAD() / LAG()', 'OVER (PARTITION BY)', 'Running Totals'],
  },
  {
    phase: 7,
    name: 'Phase 7: CTEs & Recursion',
    desc: 'Organize complex multi-step transformations with Common Table Expressions (WITH clauses) and recursive hierarchy queries.',
    topics: ['WITH (CTEs)', 'Recursive CTEs', 'Hierarchical Trees', 'Multi-CTE Pipelines'],
  },
  {
    phase: 8,
    name: 'Phase 8: Production Case Studies',
    desc: 'End-to-end real-world database interview problems: retention analysis, funnel analysis, revenue metrics, and optimization.',
    topics: ['Retention Cohorts', 'Funnel Analytics', 'Gaps & Islands', 'Query Optimization', 'Index Tuning'],
  },
];

export default function MyProgressPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [mySolves, setMySolves] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }

    Promise.all([
      api.getQuestions(token).catch(() => []),
      api.getMySolves(token).catch(() => []),
      api.getEngagement(token).catch(() => null),
    ]).then(([qs, sv, eng]) => {
      setQuestions(Array.isArray(qs) ? qs : []);
      setMySolves(Array.isArray(sv) ? sv : []);
      setEngagement(eng);
    }).finally(() => setLoading(false));
  }, [token, authLoading, user?.role]);

  // Verified solves map
  const solvedMap = useMemo(() => {
    const map: Record<string, any> = {};
    mySolves.forEach((s: any) => {
      if (s.status === 'mentor_verified' || s.status === 'auto_verified') {
        map[s.questionId] = s;
      }
    });
    return map;
  }, [mySolves]);

  const verifiedCount = Object.keys(solvedMap).length;
  const totalQuestions = questions.length || 350;
  const overallPercentage = totalQuestions > 0 ? Math.round((verifiedCount / totalQuestions) * 100) : 0;

  // Phase statistics
  const phaseStats = useMemo(() => {
    return PHASE_DETAILS.map(p => {
      const qInPhase = questions.filter(q => q.phase === p.phase);
      const total = qInPhase.length > 0 ? qInPhase.length : (p.phase <= 4 ? 50 : 30);
      const solved = qInPhase.filter(q => Boolean(solvedMap[q.id])).length;
      const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

      const easyCount = qInPhase.filter(q => q.difficulty?.toLowerCase() === 'easy').length;
      const medCount = qInPhase.filter(q => q.difficulty?.toLowerCase() === 'medium').length;
      const hardCount = qInPhase.filter(q => q.difficulty?.toLowerCase() === 'hard').length;

      let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
      if (pct === 100) status = 'completed';
      else if (solved > 0) status = 'in_progress';

      return {
        ...p,
        total,
        solved,
        pct,
        easyCount,
        medCount,
        hardCount,
        status,
      };
    });
  }, [questions, solvedMap]);

  const completedPhasesCount = phaseStats.filter(p => p.status === 'completed').length;

  if (loading || authLoading) {
    return (
      <StudentLayout>
        <div className="pt-[20px] px-5 md:px-7 max-w-[1440px] mx-auto space-y-6 pb-16 bg-[#FBF6ED]">
          <Skeleton className="h-20 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
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
                My Progress & Curriculum Mastery
              </h1>
              <p className="text-xs font-medium text-[#554C44] mt-1">
                Detailed phase-by-phase breakdown of your SQLPath journey and completed concepts.
              </p>
            </div>

            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E3703C] hover:bg-[#C95826] text-[#FFFDF9] text-xs font-bold shadow-md shadow-[#E3703C]/20 transition-all"
            >
              <Icon name="map" size={16} />
              <span>Open Roadmap</span>
            </Link>
          </motion.div>

          {/* ── 4 Top Overview Stat Cards ── */}
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* 1. Solved Questions */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                  <Icon name="menu_book" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {verifiedCount} <span className="text-xs font-normal text-[#8C877F]">/ {totalQuestions}</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Verified Solves</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                <div className="h-full rounded-full bg-[#E3703C]" style={{ width: `${Math.max(5, overallPercentage)}%` }} />
              </div>
            </motion.div>

            {/* 2. Overall Completion */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE5D3] text-[#E3703C] flex items-center justify-center">
                  <Icon name="pie_chart" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {overallPercentage}%
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Curriculum Completed</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                <div className="h-full rounded-full bg-[#E3703C]" style={{ width: `${Math.max(5, overallPercentage)}%` }} />
              </div>
            </motion.div>

            {/* 3. Phases Mastered */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF1E9] text-[#EFAE90] flex items-center justify-center">
                  <Icon name="emoji_events" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {completedPhasesCount} <span className="text-xs font-normal text-[#8C877F]">/ 8</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Phases Mastered</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                <div className="h-full rounded-full bg-[#EFAE90]" style={{ width: `${(completedPhasesCount / 8) * 100}%` }} />
              </div>
            </motion.div>

            {/* 4. Trust Score */}
            <motion.div variants={fadeUp} className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF7EE] text-[#2F8D46] flex items-center justify-center">
                  <Icon name="verified" size={18} />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#261E18] block leading-tight">
                    {engagement?.trustScore ?? user?.trustScore ?? 92} / 100
                  </span>
                  <span className="text-[11px] font-medium text-[#8C877F]">Trust Score</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5DFD7] overflow-hidden">
                <div className="h-full rounded-full bg-[#2F8D46]" style={{ width: `${engagement?.trustScore ?? user?.trustScore ?? 92}%` }} />
              </div>
            </motion.div>
          </motion.div>

          {/* ── 8 Detailed Phase Progress Cards ── */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#261E18]">Roadmap Phases Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseStats.map((p) => {
                let badgeBg = 'bg-[#FBF6ED] text-[#8C877F] border-[#D0CBC3]/60';
                let badgeText = 'Not Started';
                if (p.status === 'completed') {
                  badgeBg = 'bg-[#EAF7EE] text-[#2F8D46] border-emerald-200';
                  badgeText = 'Completed 100%';
                } else if (p.status === 'in_progress') {
                  badgeBg = 'bg-[#FFE5D3] text-[#E3703C] border-[#EFAE90]/40';
                  badgeText = `In Progress (${p.pct}%)`;
                }

                return (
                  <motion.div
                    key={p.phase}
                    variants={fadeUp}
                    className="bg-[#FFFBF5] rounded-2xl border border-[#D0CBC3]/70 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Phase Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E3703C] block">
                            PHASE {p.phase}
                          </span>
                          <h3 className="text-base font-bold text-[#261E18] mt-0.5">
                            {p.name.replace(/^Phase \d+: /, '')}
                          </h3>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeBg} shrink-0`}>
                          {badgeText}
                        </span>
                      </div>

                      <p className="text-xs text-[#554C44] leading-relaxed">
                        {p.desc}
                      </p>

                      {/* Topic Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {p.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#FBF6ED] text-[#554C44] border border-[#D0CBC3]/60 text-[10px] font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar & CTA */}
                    <div className="space-y-3 pt-3 border-t border-[#D0CBC3]/40">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-[#554C44] mb-1.5">
                          <span>Progress</span>
                          <span className="text-[#261E18]">
                            {p.solved} / {p.total} Questions ({p.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#E5DFD7] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#E3703C] transition-all duration-500"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3 text-[11px] text-[#8C877F]">
                          {p.easyCount > 0 && <span>{p.easyCount} Easy</span>}
                          {p.medCount > 0 && <span>{p.medCount} Med</span>}
                          {p.hardCount > 0 && <span>{p.hardCount} Hard</span>}
                        </div>

                        <Link
                          href={`/roadmap?phase=${p.phase}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#E3703C] hover:underline"
                        >
                          <span>{p.solved > 0 ? 'Continue Phase' : 'Start Phase'}</span>
                          <span className="text-sm font-bold">→</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}
