'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountSettings() {
  const { user, token, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user?.leetcodeUsername ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const verificationToken = user?.id ? `SQLPATH-${String(user.id).slice(0, 8).toUpperCase()}` : '';

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verificationToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission unavailable — the code is still visible and
      // selectable in the <code> box, so let the user copy it manually.
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    setError('');
    setHint('');
    try {
      const res = await api.setLeetcodeUsername(token!, username.trim());
      updateUser({ leetcodeUsername: res.leetcodeUsername, leetcodeVerified: true });
      setHint('Verified! Your LeetCode solves will now auto-verify.');
    } catch (err: any) {
      setError(err.message ?? 'Verification failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ duration: 0.2 }}
        className={`p-1.5 rounded transition-colors ${open ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'}`}
        title="Account settings"
      >
        <Icon name="settings" />
      </motion.button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-96 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 p-4"
        >
          <h3 className="text-label-md text-on-surface font-bold mb-1">LeetCode Account</h3>
          <p className="text-label-sm text-on-surface-variant mb-3">
            Link your LeetCode username to get LeetCode solves auto-verified.
          </p>

          {user?.leetcodeVerified ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="flex items-center gap-2 bg-tertiary-container/30 border border-tertiary-container/50 rounded-lg px-3 py-2"
            >
              <Icon name="check_circle" filled className="text-tertiary" size={18} />
              <span className="text-body-md text-on-surface">
                Verified as <span className="font-code text-code">{user.leetcodeUsername}</span>
              </span>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3 space-y-2">
                <p className="text-label-sm text-on-surface">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] font-bold mr-1.5">1</span>
                  Copy this code and paste it into your LeetCode bio (Profile → Edit Profile → About Me):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-code text-code bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-on-surface">
                    {verificationToken}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-label-sm text-primary hover:bg-primary/10 px-2 py-1.5 rounded transition-colors flex-shrink-0"
                  >
                    <Icon name={copied ? 'check' : 'content_copy'} size={16} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <a
                  href="https://leetcode.com/profile/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-label-sm text-primary hover:underline"
                >
                  Open LeetCode profile <Icon name="north_east" size={14} />
                </a>
              </div>

              <div>
                <p className="text-label-sm text-on-surface mb-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] font-bold mr-1.5">2</span>
                  Enter your username and verify:
                </p>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your-leetcode-username"
                  className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {error && (
                <p className="text-label-sm text-error">{error}</p>
              )}
              {hint && (
                <p className="text-label-sm text-tertiary">{hint}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !username.trim()}
                className="w-full h-9 bg-primary text-on-primary rounded-lg text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader size={14} className="border-white/30 border-t-white" />}
                {saving ? 'Verifying...' : 'Verify username'}
              </button>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
