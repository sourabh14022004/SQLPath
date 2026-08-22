'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import AccountSettings from '@/components/AccountSettings';
import CountUp from '@/components/CountUp';
import { initials } from '@/lib/utils';

const STUDENT_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <nav className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 h-16">
      <div className="flex items-center h-full gap-8">
        <Link href="/" className="text-headline-md font-bold text-primary">SQLPath</Link>
        <div className="hidden md:flex h-full items-center gap-6">
          {STUDENT_LINKS.map(l => {
            const active = pathname === l.href || pathname.startsWith(l.href + '/');
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative h-full flex items-center text-body-md transition-colors ${
                  active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {l.label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {typeof user?.trustScore === 'number' && (
          <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant">
            <Icon name="shield" filled className="text-tertiary mr-1" size={18} />
            <span className="text-label-sm text-on-surface">
              Trust Score: <CountUp value={user.trustScore} suffix="%" className="font-bold" />
            </span>
          </div>
        )}
        <AccountSettings />
        <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-label-md text-on-surface">{user?.name}</span>
            <span className="text-label-sm text-on-surface-variant capitalize">{user?.role}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold border border-outline-variant flex-shrink-0">
            {initials(user?.name)}
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-on-surface-variant hover:text-error transition-colors p-1"
            title="Sign out"
          >
            <Icon name="logout" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
