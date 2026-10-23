import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100',
      icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-2',
        current.bg
      )}
    >
      {current.icon}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
