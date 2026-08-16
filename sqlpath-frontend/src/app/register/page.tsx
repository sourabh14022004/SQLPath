'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: '' },
  { key: 'email', label: 'Email address', type: 'email', placeholder: 'name@example.com' },
  { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
  { key: 'cohortCode', label: 'Cohort Code', type: 'text', placeholder: 'e.g. SQLPATH2025' },
] as const;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', cohortCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
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
            <h1 className="text-headline-lg text-on-surface mb-2 tracking-tight">Join SQLPath</h1>
            <p className="text-body-md text-on-surface-variant">Enter your cohort code to register</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              >
                <label className="block text-label-md text-on-surface mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none transition-all"
                  placeholder={field.placeholder}
                  required
                />
              </motion.div>
            ))}

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
                {loading ? 'Creating account...' : 'Create account'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-label-sm text-on-surface-variant">Already have an account? </span>
            <Link href="/login" className="text-label-sm text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
