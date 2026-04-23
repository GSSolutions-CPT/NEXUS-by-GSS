'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We could log to Sentry here later
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center px-6">
      <div className="bg-neutral-800/50 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
        
        <div className="flex justify-center">
          <div className="bg-red-500/10 p-4 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h1>
          <p className="text-neutral-400 text-sm">
            An unexpected error occurred. Our team has been notified.
            <br />
            Please try again or return home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
