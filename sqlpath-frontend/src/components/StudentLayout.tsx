'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { initials } from '@/lib/utils';

const STUDENT_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/roadmap', label: 'Roadmap', icon: 'map' },
  { href: '/progress', label: 'My Progress', icon: 'assignment_turned_in' },
  { href: '/profile', label: 'Coding Profiles', icon: 'group' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'emoji_events' },
  { href: '/activity', label: 'Activity', icon: 'schedule' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#261E18] text-[#D0CBC3] select-none">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-[#E3703C] flex items-center justify-center shadow-md shadow-black/40">
            <Icon name="database" size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#FFFDF9] tracking-tight">SQLPath</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-[#8C877F] hover:text-[#FFFDF9] lg:hidden p-1">
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {STUDENT_NAV.map(item => {
          const active =
            pathname === item.href ||
            (item.href === '/dashboard' && pathname === '/') ||
            (item.href !== '/dashboard' && !item.href.includes('#') && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-[#E3703C] text-[#FFFDF9] shadow-md shadow-black/30'
                  : 'text-[#D0CBC3] hover:bg-[#342A22] hover:text-[#FFFDF9]'
              }`}
            >
              <Icon name={item.icon} size={18} className={active ? 'text-white' : 'text-[#8C877F]'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#3B322A] shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1E1712] border border-[#3B322A] hover:border-[#554C44] transition-colors">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E3703C] to-[#EFAE90] text-[#FFFDF9] flex items-center justify-center text-xs font-bold shadow-xs">
              {initials(user?.name)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1E1712]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#FFFDF9] truncate leading-tight">
              {user?.name || 'Sourabh Sarkar'}
            </p>
            <p className="text-[11px] text-[#8C877F] capitalize truncate mt-0.5">
              {user?.role === 'mentor' ? 'Mentor' : 'Student'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-[#8C877F] hover:text-red-400 transition-colors p-1 shrink-0"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FBF6ED] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 shadow-lg z-20">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed top-0 left-0 bottom-0 w-60 z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content + mobile topbar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-[#3B322A] bg-[#261E18] text-[#FFFDF9] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-[#D0CBC3] hover:text-white">
            <Icon name="menu" size={24} />
          </button>
          <span className="text-base font-bold text-[#FFFDF9]">SQLPath</span>
          <div className="w-6" />
        </div>
        <div className="flex-1 overflow-y-auto bg-[#FBF6ED]">
          {children}
        </div>
      </div>
    </div>
  );
}
