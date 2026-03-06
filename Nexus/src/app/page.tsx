"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        throw new Error(authError?.message || "Invalid login credentials.");
      }

      // 2. Fetch the user's role from the 'profiles' table to route them correctly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found. Please contact support.");
      }

      // 3. Route to the correct dashboard
      if (profile.role === 'SuperAdmin') {
        router.push('/admin');
      } else if (profile.role === 'GroupAdmin') {
        router.push('/owner');
      } else if (profile.role === 'Guard') {
        router.push('/guard');
      } else {
        throw new Error("Unknown role assignment.");
      }

      router.refresh(); // Refresh to trigger middleware newly set cookies

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-8 sm:p-12">
        {/* Glassmorphic Card */}
        <div className="w-full rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6 text-center">

            <Image
              src="/logo-512.svg"
              alt="Global Security Solutions Logo"
              width={120}
              height={120}
              priority
              className="drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            />

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                Nexus Portal
              </h1>
              <p className="text-sm text-slate-400">
                Authorized Personnel Only
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4 mt-4 text-left">

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</label>
                <input
                  type="email"
                  placeholder="admin@globalsecurity.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:shadow-none active:scale-[0.98]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Sign In to Nexus"
                )}
              </button>
            </form>

          </div>
        </div>

        {/* Footer Admin Watermark */}
        <p className="mt-8 text-xs text-slate-500 text-center max-w-xs">
          System engineered and maintained by <br />
          <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" className="text-sky-500/80 hover:text-sky-400 font-medium transition-colors">Global Security Solutions</a>
          <br />
          <span className="mt-2 block">24/7 Support: <a href="https://wa.me/27629558559" target="_blank" className="hover:text-slate-300">062 955 8559</a></span>
        </p>

      </main>
    </div>
  );
}
