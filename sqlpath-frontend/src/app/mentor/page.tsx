'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import MentorLayout from '@/components/MentorLayout';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import Skeleton from '@/components/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { difficultyBadge } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

const DECISION_LABEL: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated',
};

export default function MentorQueuePage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role === 'student') { router.replace('/dashboard'); return; }
    api.getMentorQueue(token)
      .then(setQueue)
      .catch(err => setError(err.message ?? 'Failed to load queue'))
      .finally(() => setLoading(false));
  }, [token, user?.role, authLoading]);

  const handleDecide = async (queueId: string, decision: 'approved' | 'rejected' | 'escalated') => {
    setDeciding(queueId);
    try {
      await api.decideSolve(token!, queueId, decision, notes[queueId]);
      setQueue(q => q.filter(item => item.queue_id !== queueId));
      show(`Solve ${DECISION_LABEL[decision].toLowerCase()}`, decision === 'rejected' ? 'info' : 'success');
    } catch (err: any) {
      show(err.message ?? 'Something went wrong', 'error');
    } finally {
      setDeciding(null);
    }
  };

  if (loading) return (
    <MentorLayout>
      <div className="p-4 md:p-6 max-w-[1000px] mx-auto w-full space-y-6">
        <Skeleton className="h-9 w-64" />
        {[0, 1].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
      </div>
    </MentorLayout>
  );

  return (
    <MentorLayout>
      <header className="px-4 md:px-6 py-6 border-b border-outline-variant bg-surface">
        <div className="max-w-[1000px] mx-auto flex items-center gap-3">
          <h2 className="text-headline-lg text-on-surface">Verification Queue</h2>
          <AnimatePresence mode="popLayout">
            {queue.length > 0 && (
              <motion.span
                key={queue.length}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="bg-error-container text-on-error-container text-label-sm px-2 py-0.5 rounded-full font-bold"
              >
                {queue.length}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="max-w-[1000px] mx-auto text-body-md text-on-surface-variant mt-1">
          Review submitted solves, spot-checks, and low-trust flags awaiting a decision.
        </p>
      </header>

      <div className="flex-1 p-4 md:p-6 overflow-auto bg-background">
        <div className="max-w-[1000px] mx-auto">
          {error && (
            <div className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3 mb-6">{error}</div>
          )}

          {!error && queue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg p-12 text-center text-on-surface-variant"
            >
              ✅ Queue is empty — all caught up!
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence mode="popLayout">
                {queue.map(item => (
                  <motion.div
                    key={item.queue_id}
                    layout
                    variants={fadeUp}
                    exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.3 } }}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

                    <div className="p-6 border-b border-outline-variant">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-headline-md text-on-surface">{item.question_title}</h3>
                        <span className={`text-label-sm px-2 py-0.5 rounded capitalize ${difficultyBadge(item.difficulty)}`}>{item.difficulty}</span>
                        <span className="bg-surface-container text-on-surface-variant text-label-sm px-2 py-0.5 rounded border border-outline-variant/30 capitalize">{item.platform}</span>
                      </div>
                      <div className="flex items-center gap-4 text-label-md text-on-surface-variant flex-wrap">
                        <div className="flex items-center gap-1">
                          <Icon name="person" size={16} />
                          <span>{item.student_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-tertiary">
                          <Icon name="verified" size={16} />
                          <span>{item.trust_score}% Trust Score</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="timer" size={16} />
                          <span>{Math.round(item.time_on_task_sec / 60)}m elapsed</span>
                        </div>
                        {Number(item.prior_rejections) > 0 && (
                          <div className="flex items-center gap-1 text-error">
                            <Icon name="warning" size={16} />
                            <span>{item.prior_rejections} prior rejections</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Submitted Query</span>
                        <div className="bg-[#231a15] border border-outline-variant rounded-lg p-4 font-code text-code text-tertiary-container overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-words"><code>{item.sql_code}</code></pre>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Screenshot</span>
                        {item.screenshot_url ? (
                          <div className="border border-outline-variant rounded-lg h-[180px] bg-surface-container-low overflow-hidden">
                            <img src={item.screenshot_url} alt="Submission proof" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="border border-outline-variant rounded-lg h-[180px] bg-surface-container-low flex items-center justify-center text-on-surface-variant text-body-md">
                            No screenshot submitted
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex-1 w-full sm:max-w-md">
                        <input
                          type="text"
                          placeholder="Add a note (optional)..."
                          value={notes[item.queue_id] ?? ''}
                          onChange={e => setNotes(n => ({ ...n, [item.queue_id]: e.target.value }))}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <motion.button
                          whileHover={{ scale: deciding ? 1 : 1.03 }}
                          whileTap={{ scale: deciding ? 1 : 0.97 }}
                          onClick={() => handleDecide(item.queue_id, 'rejected')}
                          disabled={!!deciding}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container-lowest border border-error text-error text-label-md py-2 px-4 rounded hover:bg-error/10 transition-colors disabled:opacity-50"
                        >
                          {deciding === item.queue_id ? <Loader size={16} className="border-error/30 border-t-error" /> : <Icon name="close" size={18} />}
                          Reject
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: deciding ? 1 : 1.03 }}
                          whileTap={{ scale: deciding ? 1 : 0.97 }}
                          onClick={() => handleDecide(item.queue_id, 'escalated')}
                          disabled={!!deciding}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container-lowest border border-tertiary text-tertiary text-label-md py-2 px-4 rounded hover:bg-tertiary/10 transition-colors disabled:opacity-50"
                        >
                          {deciding === item.queue_id ? <Loader size={16} className="border-tertiary/30 border-t-tertiary" /> : <Icon name="warning" size={18} />}
                          Escalate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: deciding ? 1 : 1.03 }}
                          whileTap={{ scale: deciding ? 1 : 0.97 }}
                          onClick={() => handleDecide(item.queue_id, 'approved')}
                          disabled={!!deciding}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-tertiary text-on-tertiary text-label-md py-2 px-4 rounded hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          {deciding === item.queue_id ? <Loader size={16} className="border-white/30 border-t-white" /> : <Icon name="check" filled size={18} />}
                          Approve
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </MentorLayout>
  );
}
