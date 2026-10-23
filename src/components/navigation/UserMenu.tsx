'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email
    ? user.email[0].toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open user menu"
        className="flex items-center gap-2 rounded-full p-1 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User profile'}
            width={34}
            height={34}
            className="rounded-full ring-2 ring-emerald-500/20"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-xs shadow-inner">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user.displayName || 'Household Cook'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {user.email}
            </p>
            {user.isDemoUser && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                <ShieldCheck className="w-3 h-3" /> Demo Mode
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
