"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Eye, EyeOff, Shield, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

type Mode = "login" | "forgot" | "forgot-sent";
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function AdminLogin() {
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [attempts, setAttempts] = useState(0);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);
    const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();

            if (profile?.role === "SuperAdmin") {
                setRedirecting(true);
                router.replace("/admin");
            } else {
                await supabase.auth.signOut();
                setError("Access Denied: You do not have SuperAdmin privileges.");
            }
        };
        checkSession();
    }, [supabase, router]);

    useEffect(() => {
        return () => {
            if (lockoutTimer.current) clearInterval(lockoutTimer.current);
        };
    }, []);

    const startLockout = () => {
        setLockoutRemaining(LOCKOUT_SECONDS);
        lockoutTimer.current = setInterval(() => {
            setLockoutRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(lockoutTimer.current!);
                    setAttempts(0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutRemaining > 0) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !data.user) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    startLockout();
                    throw new Error(`Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds.`);
                }
                throw new Error(authError?.message || "Invalid login credentials.");
            }

            setAttempts(0);

            // Fetch profile
            let profile = null;
            for (let i = 0; i < 3; i++) {
                const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
                if (p) { profile = p; break; }
                if (i < 2) await new Promise((r) => setTimeout(r, 800));
            }

            if (!profile || profile.role !== "SuperAdmin") {
                await supabase.auth.signOut();
                throw new Error("Access Denied: Super Administrator privileges required.");
            }

            router.push("/admin");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

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
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (redirecting) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4 text-amber-500">
                    <span className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium">Entering Secure Admin Gateway…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-950 font-sans selection:bg-amber-500/30">
            {/* Background effects */}
            <div className="absolute top-[-30%] left-[-15%] w-[900px] h-[900px] bg-amber-600/10 rounded-full blur-[150px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] bg-red-600/10 rounded-full blur-[180px] pointer-events-none animate-[pulse_12s_ease-in-out_infinite_2s]" />

            <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center justify-center px-4 py-8">
                <div className="w-full relative">
                    <div className="w-full relative rounded-[28px] bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-2xl border border-amber-500/20 p-7 sm:p-9 shadow-[0_0_60px_rgba(245,158,11,0.1)]">
                        <div className="flex flex-col items-center gap-7 text-center">
                            
                            <div className="relative group">
                                <div className="absolute -inset-3 bg-amber-500/15 rounded-3xl blur-2xl transition-colors duration-700" />
                                <div className="relative p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-inner backdrop-blur-sm">
                                    <Shield className="w-[56px] h-[56px] text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                                </div>
                            </div>

                            {mode === "login" && (
                                <div className="w-full flex flex-col items-center">
                                    <div className="space-y-2 mb-7">
                                        <h1 className="text-[28px] font-extrabold tracking-tight text-white">System Admin</h1>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">Authorized Access Only</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                                        {error && (
                                            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center backdrop-blur-sm">
                                                {error}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" /> Email
                                            </label>
                                            <input type="email" placeholder="admin@domain.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading || lockoutRemaining > 0} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                                                    <Lock className="w-3 h-3" /> Password
                                                </label>
                                                <button type="button" onClick={() => setMode("forgot")} className="text-[11px] font-medium text-amber-500/70 hover:text-amber-400 transition-colors">Forgot password?</button>
                                            </div>
                                            <div className="relative">
                                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading || lockoutRemaining > 0} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 pr-12 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={loading || lockoutRemaining > 0} className="w-full h-[52px] mt-5 flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-white font-bold text-[15px] transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.2)]">
                                            {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Authenticate"}
                                        </button>
                                    </form>
                                    <Link href="/" className="mt-6 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Portals
                                    </Link>
                                </div>
                            )}

                            {mode === "forgot" && (
                                <div className="w-full flex flex-col items-center">
                                    <h1 className="text-2xl font-bold text-white mb-2">Admin Reset</h1>
                                    <p className="text-xs text-slate-400 mb-6">Enter your administrator email.</p>

                                    <form onSubmit={handleForgotPassword} className="w-full space-y-4">
                                        {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl">{error}</div>}
                                        <input type="email" placeholder="admin@domain.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 text-white focus:ring-2 focus:ring-amber-500/30 transition-all" />
                                        <button type="submit" disabled={loading} className="w-full h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition-all">
                                            {loading ? "Sending..." : "Send Reset Link"}
                                        </button>
                                        <button type="button" onClick={() => setMode("login")} className="w-full text-xs text-slate-400 hover:text-white pt-2">Back to Sign In</button>
                                    </form>
                                </div>
                            )}

                            {mode === "forgot-sent" && (
                                <div className="w-full text-center space-y-6">
                                    <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-2">Link Sent</h2>
                                        <p className="text-sm text-slate-400">We've sent an admin recovery link to <br/><span className="text-amber-400">{email}</span></p>
                                    </div>
                                    <button onClick={() => setMode("login")} className="w-full h-12 rounded-xl bg-slate-800 text-white font-medium">Return to Login</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
