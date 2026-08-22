'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import StudentLayout from '@/components/StudentLayout';
import Icon from '@/components/Icon';
import Loader, { FullPageLoader } from '@/components/Loader';
import CountUp from '@/components/CountUp';
import Confetti from '@/components/Confetti';
import { difficultyBadge } from '@/lib/utils';

export default function QuestionPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [question, setQuestion] = useState<any>(null);
  const [sqlCode, setSqlCode] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role && user.role !== 'student') { router.replace('/mentor'); return; }
    api.openQuestion(token, id)
      .then(res => setQuestion(res.question))
      .catch(err => setLoadError(err.message ?? 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [token, id, authLoading, user?.role]);

  const isLeetCode = question?.platform === 'leetcode';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeetCode && !sqlCode.trim()) { setError('SQL code is required'); return; }
    if (!isLeetCode && !screenshot) { setError('Screenshot is required for non-LeetCode questions'); return; }

    setError('');
    setSubmitting(true);
    try {
      const res = await api.submitSolve(token!, id, sqlCode, screenshot ?? undefined);
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader />;

  if (loadError) return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3">{loadError}</div>
      </div>
    </StudentLayout>
  );

  if (!question) return <div className="p-8 text-on-surface-variant">Question not found.</div>;

  return (
    <StudentLayout>
      <main className="pb-12 px-4 md:px-6 py-8 max-w-3xl mx-auto space-y-6">

        <motion.button
          onClick={() => router.push('/roadmap')}
          whileHover={{ x: -3 }}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-sm"
        >
          <Icon name="arrow_back" size={16} />
          Roadmap
        </motion.button>

        {/* Question header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                <span>Q#{question.number}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>Phase {question.phase}</span>
              </div>
              <h1 className="text-headline-lg text-on-surface tracking-tight">{question.title}</h1>
              <div className="text-body-md text-on-surface-variant pt-1">
                Topic: <span className="font-medium text-on-surface">{question.topic}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex gap-2">
                <span className={`px-2.5 py-1 text-label-sm rounded capitalize ${difficultyBadge(question.difficulty)}`}>
                  {question.difficulty}
                </span>
                <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-label-sm rounded border border-outline-variant flex items-center gap-1 capitalize">
                  <Icon name="link" size={14} /> {question.platform}
                </span>
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant text-label-sm mt-2">
                <span className="flex items-center gap-1"><Icon name="schedule" size={16} /> {question.estimatedMinutes} min</span>
                <span className="flex items-center gap-1"><Icon name="toll" size={16} /> {question.basePoints} base pts</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant">
            <motion.a
              href={question.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded text-label-md hover:bg-primary/90 transition-colors"
            >
              Open on {question.platform} <Icon name="north_east" size={18} />
            </motion.a>
          </div>
        </motion.div>

        {/* Submit form */}
        {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-6"
            >
              {isLeetCode && (
                <div className="flex items-center gap-2 bg-surface-container-low p-3 rounded border border-outline-variant">
                  <Icon name="bolt" className="text-tertiary" size={20} />
                  <span className="text-body-md text-on-surface">LeetCode questions are auto-verified. Submit on LeetCode first, and make sure your username is set in your profile.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLeetCode && (
                  <div className="space-y-2">
                    <label className="text-label-md text-on-surface">Your SQL code *</label>
                    <textarea
                      value={sqlCode}
                      onChange={e => setSqlCode(e.target.value)}
                      rows={8}
                      className="w-full bg-[#1e1e1e] text-[#ddc676] font-code text-code p-4 rounded border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y outline-none"
                      placeholder="Paste your solution here..."
                    />
                  </div>
                )}

                {!isLeetCode && (
                  <div>
                    <label className="block text-label-md text-on-surface mb-2">
                      Proof screenshot <span className="text-error">*</span>
                    </label>
                    <p className="text-label-sm text-on-surface-variant mb-3">
                      Screenshot must show: platform name · problem title · "All test cases passed" · your SQL
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      className="border-2 border-dashed border-outline-variant rounded-lg p-4 text-center hover:border-primary transition-colors"
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label htmlFor="screenshot-upload" className="cursor-pointer">
                        {screenshot ? (
                          <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-body-md text-tertiary font-medium"
                          >
                            ✓ {screenshot.name}
                          </motion.p>
                        ) : (
                          <>
                            <p className="text-body-md text-on-surface-variant">Click to upload screenshot</p>
                            <p className="text-label-sm text-on-surface-variant mt-1">PNG, JPG, WebP · max 5MB</p>
                          </>
                        )}
                      </label>
                    </motion.div>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3 text-body-md overflow-hidden"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.01 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded text-label-md hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {submitting && <Loader size={16} className="border-white/30 border-t-white" />}
                  {submitting ? 'Submitting...' : 'Submit Solve'}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-container-lowest border border-outline-variant rounded-lg p-10 text-center overflow-hidden"
            >
              <Confetti />
              <div className="relative flex flex-col items-center gap-6">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 bg-tertiary/10 rounded-full flex items-center justify-center text-tertiary border border-tertiary/20"
                >
                  <Icon name="task_alt" size={32} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <h2 className="text-headline-lg text-on-surface tracking-tight">{result.message}</h2>
                  <p className="text-body-md text-on-surface-variant">
                    Evidence tier: {result.evidenceTier} · <CountUp value={Number(result.scoreAwarded)} decimals={1} prefix="+" className="font-bold text-tertiary" /> points awarded
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/roadmap')}
                    className="inline-flex items-center justify-center gap-2 bg-surface text-on-surface px-6 py-2.5 rounded text-label-md hover:bg-surface-container-high transition-colors border border-outline-variant"
                  >
                    Back to Roadmap
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded text-label-md hover:bg-primary/90 transition-colors"
                  >
                    Go to Dashboard
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
      </main>
    </StudentLayout>
  );
}
