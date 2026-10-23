import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PackageOpen, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-subtle">
        <PackageOpen className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-2">
        Error 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Pantry Shelf Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        The page or recipe you are looking for doesn&apos;t seem to be in the pantry. It might have been
        relocated or removed.
      </p>
      <Link href="/">
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
