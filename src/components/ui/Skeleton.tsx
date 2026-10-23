import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export function Skeleton({ className, variant = 'rounded', ...props }: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-800',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function PantryCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16" variant="rounded" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
