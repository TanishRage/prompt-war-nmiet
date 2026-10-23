'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Leaf, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, signInAsDemo, isFirebaseConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was interrupted or failed.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-xl border-slate-200 dark:border-slate-800">
        {/* Brand header */}
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
            <Leaf className="h-8 w-8 fill-white/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome to PantryPilot
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Stop throwing food away. Track pantry items & expiry dates with ease.
            </p>
          </div>
        </div>

        {/* Value proposition badges */}
        <div className="mb-8 space-y-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Smart expiry alerts before ingredients spoil</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Built-in shelf-life database for 40+ common items</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Private & secure: your household pantry data is isolated</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-950/60 dark:border-red-800 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Authentication Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 font-medium py-3 text-slate-700 dark:text-slate-200"
            onClick={handleGoogleSignIn}
            isLoading={loading}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </Button>

          {/* Quick Demo Sign In for evaluation or when env vars are unconfigured */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">
              or instant evaluation
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
            onClick={signInAsDemo}
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
            Continue as Guest / Demo Cook
          </Button>
        </div>

        {!isFirebaseConfigured && (
          <p className="mt-6 text-[11px] text-center text-slate-400 leading-relaxed">
            Note: Running with local guest storage until live Firebase credentials are set in{' '}
            <code className="text-slate-600 dark:text-slate-300 font-mono">.env.local</code>.
          </p>
        )}
      </Card>
    </div>
  );
}
