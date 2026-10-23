'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Refrigerator, CalendarDays, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const tabs = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pantry', label: 'Pantry', icon: Refrigerator },
    { href: '/planner', label: 'Planner', icon: CalendarDays },
    { href: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 dark:bg-slate-950/95 dark:border-slate-800 transition-colors pb-safe"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all rounded-xl',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-all',
                  isActive && 'bg-emerald-50 dark:bg-emerald-950/60'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'stroke-[2.3]' : 'stroke-2')} />
              </div>
              <span className="mt-0.5 text-[11px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
