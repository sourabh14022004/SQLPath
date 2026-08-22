'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { initials } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/admin/questions', label: 'Questions', icon: 'quiz' },
  { href: '/admin/students', label: 'Students', icon: 'group' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const activeItem =
    NAV_ITEMS.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href)) ??
    (pathname.startsWith('/admin/student/') ? { label: 'Student Detail', icon: 'person' } : null);

  return (
    <div className="min-h-screen flex bg-background text-on-background">
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-surface border-r border-outline-variant flex-col p-4 z-40">
        <div className="mb-8 px-1 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-container text-primary flex-shrink-0">
            <Icon name="database" size={20} />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-on-surface leading-tight">SQLPath Pro</h1>
            <p className="text-label-sm text-on-surface-variant">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 p-2 rounded-lg text-label-md transition-colors ${
                  active
                    ? 'text-on-secondary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-active"
                    className="absolute inset-0 bg-secondary-container rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <Icon name={item.icon} filled={active} size={20} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold border border-outline-variant flex-shrink-0">
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-label-md text-on-surface truncate">{user?.name}</p>
              <p className="text-label-sm text-on-surface-variant capitalize">Admin</p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high hover:text-error p-2 rounded text-label-md transition-colors"
          >
            <Icon name="logout" size={20} />
            Sign out
          </motion.button>
        </div>
      </aside>

      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        <header className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 right-0 left-0 md:left-[240px] z-30 flex justify-between items-center px-4 md:px-6 h-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem?.label ?? 'default'}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-label-md text-on-surface font-bold"
            >
              {activeItem && <Icon name={activeItem.icon} size={18} className="text-on-surface-variant" />}
              {activeItem?.label ?? 'Admin Console'}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-label-md text-on-surface">{user?.name}</span>
              <span className="text-label-sm text-on-surface-variant">Admin</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold border border-outline-variant flex-shrink-0">
              {initials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16 bg-background flex flex-col">{children}</main>
      </div>
    </div>
  );
}
