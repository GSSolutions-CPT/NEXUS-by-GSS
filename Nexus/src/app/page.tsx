"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Eye, EyeOff, Shield, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

type Mode = "login" | "forgot" | "forgot-sent";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#060A14] font-sans selection:bg-sky-500/30">

      {/* Animated background orbs */}
      <div className="absolute top-[-30%] left-[-15%] w-[900px] h-[900px] bg-sky-600/8 rounded-full blur-[150px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[180px] pointer-events-none animate-[pulse_12s_ease-in-out_infinite_2s]" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite_1s]" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#060A14_100%)] pointer-events-none" />

      <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center justify-center px-4 py-8">
        <div className="w-full relative">

          {/* Animated gradient border */}
          <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-sky-500/25 via-transparent to-indigo-500/25 blur-[1px] pointer-events-none animate-[spin_20s_linear_infinite]" style={{ backgroundSize: '200% 200%' }} />
          <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />

          <div className="w-full relative rounded-[28px] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-2xl border border-white/[0.06] p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(14,165,233,0.05)]">
            <div className="flex flex-col items-center gap-7 text-center">

              {/* Logo with animated glow ring */}
              <div className="relative group">
                <div className="absolute -inset-3 bg-sky-500/15 rounded-3xl blur-2xl group-hover:bg-sky-400/20 transition-colors duration-700" />
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 pointer-events-none" />
                <div className="relative p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.06] shadow-inner backdrop-blur-sm">
                  <Image src="/logo-512.svg" alt="Global Security Solutions" width={56} height={56} priority
                    className="relative z-10 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)] group-hover:drop-shadow-[0_0_30px_rgba(14,165,233,0.7)] transition-all duration-500" />
                </div>
              </div>

              {/* ── LOGIN MODE ── */}
              {mode === "login" && (
                <div className="w-full flex flex-col items-center">
                  <div className="space-y-2 mb-7">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                      Nexus Portal
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-3 h-3 text-sky-400/80" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/70">Authorized Personnel Only</p>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                    {error && (
                      <div className="p-3.5 bg-rose-500/8 border border-rose-500/15 text-rose-400 text-xs font-medium rounded-xl text-center backdrop-blur-sm flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        {error}
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        Email Address
                      </label>
                      <div className="relative group/input">
                        <input type="email" placeholder="admin@globalsecurity.co.za" value={email}
                          onChange={e => setEmail(e.target.value)} disabled={loading} required
                          className="w-full h-[52px] rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-40" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Password Field with Eye Toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Password
                        </label>
                        <button type="button" onClick={() => { setMode("forgot"); setError(null); }}
                          className="text-[11px] font-medium text-sky-400/70 hover:text-sky-300 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative group/input">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          disabled={loading}
                          required
                          className="w-full h-[52px] rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 pr-12 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all duration-200"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword
                            ? <EyeOff className="w-[18px] h-[18px]" />
                            : <Eye className="w-[18px] h-[18px]" />
                          }
                        </button>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={loading}
                      className="group relative w-full h-[52px] mt-5 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-[15px] transition-all duration-300 shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.4)] disabled:shadow-none active:scale-[0.98] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />
                        : <>
                            <Lock className="w-4 h-4 relative z-10" />
                            <span className="relative z-10 tracking-wide">Sign In to Nexus</span>
                          </>
                      }
                    </button>
                  </form>
                </div>
              )}

              {/* ── FORGOT PASSWORD MODE ── */}
              {mode === "forgot" && (
                <div className="w-full flex flex-col items-center">
                  <div className="space-y-2 mb-7">
                    <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">Reset Password</h1>
                    <p className="text-xs text-slate-400">Enter your email to receive a secure reset link.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="w-full space-y-4 text-left">
                    {error && (
                      <div className="p-3.5 bg-rose-500/8 border border-rose-500/15 text-rose-400 text-xs font-medium rounded-xl text-center backdrop-blur-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        Email Address
                      </label>
                      <div className="relative group/input">
                        <input type="email" placeholder="your@email.com" value={email}
                          onChange={e => setEmail(e.target.value)} disabled={loading} required
                          className="w-full h-[52px] rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-40" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="group relative w-full h-[52px] mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-semibold text-[15px] transition-all duration-300 active:scale-[0.98] overflow-hidden shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.4)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />
                        : <span className="relative z-10 tracking-wide">Send Reset Link</span>}
                    </button>

                    <button type="button" onClick={() => { setMode("login"); setError(null); }}
                      className="w-full text-xs font-medium text-slate-400 hover:text-white transition-colors text-center pt-2 flex items-center justify-center gap-1.5 group">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                      Back to Sign In
                    </button>
                  </form>
                </div>
              )}

              {/* ── EMAIL SENT CONFIRMATION ── */}
              {mode === "forgot-sent" && (
                <div className="w-full text-center space-y-6 py-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-40" />
                    <div className="relative w-full h-full bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Check your inbox</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      A secure reset link has been sent to<br/><span className="text-sky-400 font-medium">{email}</span>.
                    </p>
                  </div>

                  <button onClick={() => { setMode("login"); setError(null); }}
                    className="w-full h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium transition-all duration-300 border border-white/[0.08] mt-4 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500/80 font-medium uppercase tracking-[0.2em] mb-2.5">System Engineered By</p>
          <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl py-2.5 px-5 transition-all duration-300 w-max hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] hover:border-white/[0.08]">
            <Image src="/logo-192.svg" alt="GSS Logo" width={16} height={16} className="opacity-60 grayscale" />
            <span className="text-xs font-semibold text-slate-400">Global Security Solutions</span>
          </a>

          <div className="mt-5 flex items-center justify-center gap-4 text-xs font-medium">
            <a href="https://wa.me/27629558559" target="_blank" rel="noreferrer" className="text-slate-500/70 hover:text-slate-300 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Support
            </a>
            <span className="text-slate-700/50">•</span>
            <Link href="/privacy" className="text-slate-500/70 hover:text-slate-300 transition-colors">Privacy</Link>
            <span className="text-slate-700/50">•</span>
            <Link href="/terms" className="text-slate-500/70 hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
