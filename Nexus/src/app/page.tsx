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
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0A0F1C] font-sans selection:bg-sky-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-sky-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full relative">
          
          {/* Outer glow for the card */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-sky-500/20 to-slate-800/20 blur-sm pointer-events-none" />
          
          <div className="w-full relative rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col items-center gap-8 text-center">

              {/* Logo container with subtle inner glow */}
              <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner">
                 <div className="absolute inset-0 bg-sky-500/10 rounded-2xl filter blur-xl" />
                 <Image src="/logo-512.svg" alt="Global Security Solutions" width={80} height={80} priority className="relative z-10 drop-shadow-[0_0_15px_rgba(14,165,233,0.4)]" />
              </div>

              {/* ── LOGIN MODE ── */}
              {mode === "login" && (
                <div className="w-full flex flex-col items-center">
                  <div className="space-y-1.5 mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">Nexus Portal</h1>
                    <p className="text-xs font-medium uppercase tracking-widest text-sky-400/80">Authorized Access</p>
                  </div>

                  <form onSubmit={handleLogin} className="w-full space-y-5 text-left">
                    {error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center shadow-inner">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Email Address</label>
                      <input type="email" placeholder="admin@globalsecurity.co.za" value={email}
                        onChange={e => setEmail(e.target.value)} disabled={loading} required
                        className="w-full h-12 rounded-xl bg-slate-950/50 border border-white/10 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all shadow-inner disabled:opacity-50" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Password</label>
                        <button type="button" onClick={() => { setMode("forgot"); setError(null); }}
                          className="text-[11px] font-medium text-sky-400/80 hover:text-sky-300 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <input type="password" placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)} disabled={loading} required
                        className="w-full h-12 rounded-xl bg-slate-950/50 border border-white/10 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all shadow-inner disabled:opacity-50" />
                    </div>

                    <button type="submit" disabled={loading}
                      className="group relative w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.2)] hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] disabled:shadow-none active:scale-[0.98] overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />
                        : <span className="relative z-10 tracking-wide">Sign In to Nexus</span>}
                    </button>
                  </form>
                </div>
              )}

              {/* ── FORGOT PASSWORD MODE ── */}
              {mode === "forgot" && (
                <div className="w-full flex flex-col items-center">
                  <div className="space-y-1.5 mb-8">
                    <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">Reset Password</h1>
                    <p className="text-xs text-slate-400">Enter your email to receive a secure link.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="w-full space-y-5 text-left">
                    {error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center shadow-inner">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Email Address</label>
                      <input type="email" placeholder="your@email.com" value={email}
                        onChange={e => setEmail(e.target.value)} disabled={loading} required
                        className="w-full h-12 rounded-xl bg-slate-950/50 border border-white/10 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all shadow-inner disabled:opacity-50" />
                    </div>

                    <button type="submit" disabled={loading}
                      className="group relative w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-semibold transition-all active:scale-[0.98] overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />
                        : <span className="relative z-10 tracking-wide">Send Reset Link</span>}
                    </button>

                    <button type="button" onClick={() => { setMode("login"); setError(null); }}
                      className="w-full text-xs font-medium text-slate-400 hover:text-white transition-colors text-center pt-2 flex items-center justify-center gap-1 group">
                      <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Sign In
                    </button>
                  </form>
                </div>
              )}

              {/* ── EMAIL SENT CONFIRMATION ── */}
              {mode === "forgot-sent" && (
                <div className="w-full text-center space-y-6 py-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-50" />
                    <div className="relative w-full h-full bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <svg className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0L10.75 14.5" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Check your inbox</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      A secure link has been sent to <br/><span className="text-sky-400 font-medium">{email}</span>.
                    </p>
                  </div>
                  
                  <button onClick={() => { setMode("login"); setError(null); }}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10 mt-4">
                    Back to Sign In
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest mb-3">System Engineered By</p>
          <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-800/80 border border-white/[0.05] rounded-xl py-2.5 px-5 transition-all w-max hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
             <Image src="/logo-192.svg" alt="GSS Logo" width={16} height={16} className="opacity-70 grayscale" />
             <span className="text-xs font-semibold text-slate-300">Global Security Solutions</span>
          </a>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium">
             <a href="https://wa.me/27629558559" target="_blank" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> Support</a>
             <span className="text-slate-700">•</span>
             <a href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">Privacy</a>
             <span className="text-slate-700">•</span>
             <a href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">Terms</a>
          </div>
        </div>
      </main>
    </div>
  );
}
