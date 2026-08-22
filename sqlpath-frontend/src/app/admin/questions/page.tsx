'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { difficultyBadge, platformBadge } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

const PLATFORMS = ['leetcode', 'hackerrank', 'codeforces', 'geeksforgeeks', 'datalemur', 'stratascratch', 'sqlzoo'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PHASES = [1, 2, 3, 4, 5];

const EMPTY_FORM = {
  title: '', platform: 'leetcode', url: '', topic: '',
  difficulty: 'easy', phase: 1, estimatedMinutes: 15, leetcodeSlug: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-label-sm font-medium text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-on-surface-variant";

function QuestionModal({ initial, onSave, onClose }: {
  initial?: any;
  onSave: (dto: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial ? {
    title: initial.title ?? '',
    platform: initial.platform ?? 'leetcode',
    url: initial.url ?? '',
    topic: initial.topic ?? '',
    difficulty: initial.difficulty ?? 'easy',
    phase: initial.phase ?? 1,
    estimatedMinutes: initial.estimated_minutes ?? 15,
    leetcodeSlug: initial.leetcode_slug ?? '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        phase: Number(form.phase),
        estimatedMinutes: Number(form.estimatedMinutes),
        leetcodeSlug: form.leetcodeSlug || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(38,30,24,0.5)', backdropFilter: 'blur(2px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface rounded-2xl border border-outline-variant w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-outline-variant flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center flex-shrink-0">
            <Icon name={initial ? 'edit' : 'add'} size={17} />
          </div>
          <div>
            <h2 className="text-title-sm font-bold text-on-surface">{initial ? 'Edit Question' : 'Add Question'}</h2>
            <p className="text-label-sm text-on-surface-variant">{initial ? 'Modify the question details below' : 'Fill in the details for the new question'}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Title *">
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className={inputCls} placeholder="e.g. Rising Temperature" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform *">
              <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inputCls}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Difficulty *">
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phase *">
              <select value={form.phase} onChange={e => set('phase', e.target.value)} className={inputCls}>
                {PHASES.map(p => <option key={p} value={p}>Phase {p}</option>)}
              </select>
            </Field>
            <Field label="Est. Minutes *">
              <input type="number" min={1} required value={form.estimatedMinutes}
                onChange={e => set('estimatedMinutes', e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Topic *">
            <input required value={form.topic} onChange={e => set('topic', e.target.value)}
              className={inputCls} placeholder="e.g. Date Functions, Joins, Window Functions" />
          </Field>

          <Field label="URL *">
            <input required value={form.url} onChange={e => set('url', e.target.value)}
              className={inputCls} placeholder="https://leetcode.com/problems/..." />
          </Field>

          {form.platform === 'leetcode' && (
            <Field label="LeetCode Slug">
              <input value={form.leetcodeSlug} onChange={e => set('leetcodeSlug', e.target.value)}
                className={inputCls} placeholder="rising-temperature" />
              <p className="text-[11px] text-on-surface-variant">Used for auto-verification. Leave blank to skip.</p>
            </Field>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminQuestionsPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; q?: any } | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    load();
  }, [token, user?.role, authLoading]);

  const load = () => {
    setLoading(true);
    api.adminGetHeatmap(token!).then(setQuestions).finally(() => setLoading(false));
  };

  const handleSave = async (dto: any) => {
    if (modal?.mode === 'edit' && modal.q) {
      await api.adminUpdateQuestion(token!, modal.q.id, dto);
      show('Question updated', 'success');
    } else {
      await api.adminCreateQuestion(token!, dto);
      show('Question added', 'success');
    }
    load();
  };

  const handleToggle = async (q: any) => {
    setActing(q.id);
    try {
      if (q.is_active) {
        if (!confirm(`Deactivate "${q.title}"? It will be hidden from students.`)) return;
        await api.adminDeleteQuestion(token!, q.id);
        show('Question deactivated', 'info');
      } else {
        await api.adminUpdateQuestion(token!, q.id, { isActive: true });
        show('Question reactivated', 'success');
      }
      load();
    } catch (e: any) {
      show(e.message, 'error');
    } finally {
      setActing(null);
    }
  };

  const availablePlatforms = [...new Set([...PLATFORMS, ...questions.map(q => q.platform).filter(Boolean)])];
  const phases = [...new Set(questions.map(q => q.phase))].sort((a, b) => Number(a) - Number(b));
  const filtered = questions.filter(q => {
    if (!showInactive && !q.is_active) return false;
    if (platformFilter && q.platform?.toLowerCase() !== platformFilter.toLowerCase()) return false;
    if (diffFilter && q.difficulty?.toLowerCase() !== diffFilter.toLowerCase()) return false;
    if (phaseFilter && String(q.phase) !== phaseFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.title.toLowerCase().includes(s) && !q.topic?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const activeCount = questions.filter(q => q.is_active).length;

  return (
    <AdminLayout>
      <AnimatePresence>
        {modal && (
          <QuestionModal key="modal" initial={modal.q} onSave={handleSave} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>

      <motion.div variants={staggerContainer()} initial="hidden" animate="show"
        className="p-4 md:p-6 space-y-5 max-w-[1200px] w-full">

        {/* Page header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
              <Icon name="quiz" size={20} filled />
            </div>
            <div>
              <h1 className="text-headline-md text-on-surface">Questions</h1>
              <p className="text-label-sm text-on-surface-variant">{activeCount} active · {questions.length} total</p>
            </div>
          </div>
          <button onClick={() => setModal({ mode: 'add' })}
            className="sm:ml-auto flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-label-md font-bold hover:opacity-90 transition-all shadow-sm">
            <Icon name="add" size={18} />
            Add Question
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title or topic…"
              className="pl-8 pr-3 py-1.5 text-label-md bg-surface border border-outline-variant rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant w-48" />
          </div>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
            className="text-label-md bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface">
            <option value="">All Platforms</option>
            {availablePlatforms.map(p => (
              <option key={p} value={p}>
                {p === 'leetcode' ? 'LeetCode' :
                 p === 'hackerrank' ? 'HackerRank' :
                 p === 'codeforces' ? 'Codeforces' :
                 p === 'geeksforgeeks' ? 'GeeksforGeeks' :
                 p === 'datalemur' ? 'DataLemur' :
                 p === 'stratascratch' ? 'StrataScratch' :
                 p === 'sqlzoo' ? 'SQLZoo' :
                 p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
            className="text-label-md bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface capitalize">
            <option value="">All Difficulty</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}
            className="text-label-md bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface">
            <option value="">All Phases</option>
            {phases.map(p => <option key={p} value={String(p)}>Phase {p}</option>)}
          </select>
          <label className="flex items-center gap-2 text-label-md text-on-surface-variant cursor-pointer select-none ml-auto">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-primary" />
            Show inactive
          </label>
        </motion.div>

        {/* Table */}
        <motion.div variants={fadeUp} className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-lowest">
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium w-10">#</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Question</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Platform</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Difficulty</th>
                    <th className="text-left py-3 px-3 text-label-sm text-on-surface-variant font-medium">Phase</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Pts</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Solves</th>
                    <th className="text-center py-3 px-3 text-label-sm text-on-surface-variant font-medium">Rate</th>
                    <th className="py-3 px-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <Icon name="search_off" size={32} className="text-on-surface-variant/40 block mx-auto mb-2" />
                        <p className="text-label-md text-on-surface-variant">No questions match your filters</p>
                      </td>
                    </tr>
                  ) : filtered.map(q => {
                    const rate = q.solve_rate ? `${q.solve_rate}%` : Number(q.total_opens) > 0 ? '0%' : '—';
                    return (
                      <tr key={q.id} className={`border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors ${!q.is_active ? 'opacity-40' : ''}`}>
                        <td className="py-3 px-3 text-label-sm text-on-surface-variant">{q.number}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-label-md text-on-surface font-medium">{q.title}</p>
                              <p className="text-label-sm text-on-surface-variant">{q.topic}</p>
                            </div>
                            {!q.is_active && (
                              <span className="text-[10px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-medium ml-1">off</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium capitalize ${platformBadge(q.platform)}`}>{q.platform}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-label-xs px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-label-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">P{q.phase}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-label-sm text-on-surface-variant">{q.base_points}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-label-md font-bold text-primary">{q.solved_count || 0}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-label-sm text-on-surface-variant">{rate}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setModal({ mode: 'edit', q })}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" title="Edit">
                              <Icon name="edit" size={15} />
                            </button>
                            <button onClick={() => handleToggle(q)} disabled={acting === q.id}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${q.is_active ? 'text-on-surface-variant hover:bg-error/10 hover:text-error' : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                              title={q.is_active ? 'Deactivate' : 'Reactivate'}>
                              <Icon name={q.is_active ? 'visibility_off' : 'visibility'} size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="px-4 py-2.5 border-t border-outline-variant bg-surface-container-lowest">
                  <p className="text-label-sm text-on-surface-variant">Showing {filtered.length} questions</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
