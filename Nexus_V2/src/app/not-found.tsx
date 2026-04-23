'use client';

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center px-6">
      <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
        
        <div className="flex justify-center">
          <div className="bg-neutral-700/50 p-4 rounded-full">
            <FileQuestion className="w-12 h-12 text-neutral-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">404</h1>
          <h2 className="text-xl font-medium text-neutral-300">Page not found</h2>
          <p className="text-neutral-400 text-sm">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
