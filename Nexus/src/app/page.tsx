"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "forgot" | "forgot-sent";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        throw new Error(authError?.message || "Invalid login credentials.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) throw new Error("User profile not found. Please contact support.");

      if (profile.role === "SuperAdmin") router.push("/admin");
      else if (profile.role === "GroupAdmin") router.push("/owner");
      else if (profile.role === "Guard") router.push("/guard");
      else throw new Error("Unknown role assignment.");

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) throw new Error(resetError.message);
      setMode("forgot-sent");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6 text-center">

            <Image src="/logo-512.svg" alt="Global Security Solutions Logo" width={100} height={100} priority
              className="drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]" />

            {/* ── LOGIN MODE ── */}
            {mode === "login" && (
              <>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-white">Nexus Portal</h1>
                  <p className="text-sm text-slate-400">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-4 mt-2 text-left">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</label>
                    <input type="email" placeholder="admin@globalsecurity.co.za" value={email}
                      onChange={e => setEmail(e.target.value)} disabled={loading} required
                      className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Password</label>
                      <button type="button" onClick={() => { setMode("forgot"); setError(null); }}
                        className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <input type="password" placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} disabled={loading} required
                      className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:shadow-none active:scale-[0.98]">
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      : "Sign In to Nexus"}
                  </button>
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD MODE ── */}
            {mode === "forgot" && (
              <>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
                  <p className="text-sm text-slate-400">Enter your email to receive a reset link.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="w-full space-y-4 mt-2 text-left">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</label>
                    <input type="email" placeholder="your@email.com" value={email}
                      onChange={e => setEmail(e.target.value)} disabled={loading} required
                      className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white font-semibold transition-all disabled:shadow-none active:scale-[0.98]">
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      : "Send Reset Link"}
                  </button>

                  <button type="button" onClick={() => { setMode("login"); setError(null); }}
                    className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors text-center pt-1">
                    ← Back to Sign In
                  </button>
                </form>
              </>
            )}

            {/* ── EMAIL SENT CONFIRMATION ── */}
            {mode === "forgot-sent" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0L10.75 14.5" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Check your inbox</h2>
                  <p className="text-sm text-slate-400">
                    A password reset link has been sent to <span className="text-white font-medium">{email}</span>.
                    Check your spam folder if you don&apos;t see it.
                  </p>
                </div>
                <button onClick={() => { setMode("login"); setError(null); }}
                  className="w-full h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700 mt-2">
                  Back to Sign In
                </button>
              </div>
            )}

          </div>
        </div>

        <p className="mt-8 text-xs text-slate-500 text-center max-w-xs">
          System engineered and maintained by <br />
          <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" className="text-sky-500/80 hover:text-sky-400 font-medium transition-colors">
            Global Security Solutions
          </a><br />
          <span className="mt-2 block">24/7 Support: <a href="https://wa.me/27629558559" target="_blank" className="hover:text-slate-300">062 955 8559</a></span>
        </p>
      </main>
    </div>
  );
}
