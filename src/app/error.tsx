'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-subtle">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        An unexpected error occurred while loading this page. You can try refreshing or resetting
        the view below.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => reset()} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
