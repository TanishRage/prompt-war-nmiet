'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserMenu } from './UserMenu';
import {
  Sparkles,
  LayoutDashboard,
  Refrigerator,
  CalendarDays,
  BarChart3,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide nav on login page
  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pantry', label: 'Pantry', icon: Refrigerator },
    { href: '/planner', label: 'Planner', icon: CalendarDays },
    { href: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-subtle">
            <Leaf className="h-5 w-5 fill-white/20" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Pantry<span className="text-emerald-600 dark:text-emerald-400">Pilot</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
