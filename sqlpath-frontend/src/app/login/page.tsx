'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';

const DEMO_LOGINS = [
  { label: 'Active Student', email: 'active_student@demo.com' },
  { label: 'At-risk Student', email: 'atrisk_student@demo.com' },
  { label: 'Admin', email: 'admin@demo.com' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.main
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: 'backOut', delay: 0.1 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container text-primary mb-4"
            >
              <Icon name="database" size={24} />
            </motion.div>
            <h1 className="text-headline-lg text-on-surface mb-2 tracking-tight">SQLPath</h1>
            <p className="text-body-md text-on-surface-variant">Master SQL step by step</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface mb-1" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none transition-all"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="bg-error-container/60 border border-error/30 text-on-error-container rounded-lg px-4 py-3 text-body-md overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-10 bg-primary text-on-primary rounded-lg text-label-md border-t border-white/20 hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader size={16} className="border-white/30 border-t-white" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/register" className="text-label-sm text-primary hover:underline">
              Register with cohort code
            </Link>
          </div>
        </div>

        <motion.div
          className="mt-8"
          variants={staggerContainer(0.07, 0.3)}
          initial="hidden"
          animate="show"
        >
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3 px-2">Demo Logins</p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_LOGINS.map(d => (
              <motion.button
                key={d.email}
                variants={fadeUp}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { setEmail(d.email); setPassword('Demo123!'); }}
                className="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-left group"
              >
                <div>
                  <p className="text-label-md text-on-surface">{d.label}</p>
                  <p className="font-code text-code text-on-surface-variant">{d.email}</p>
                </div>
                <Icon name="arrow_forward" className="text-outline-variant group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
