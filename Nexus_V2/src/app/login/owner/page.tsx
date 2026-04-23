"use client";


import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Eye, Home, ArrowLeft, CheckCircle2 } from "lucide-react";

type Mode = "login" | "forgot" | "forgot-sent";
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function OwnerLogin() {
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

            if (profile?.role === "GroupAdmin" || profile?.role === "SuperAdmin") {
                setRedirecting(true);
                router.replace("/owner");
            } else {
                await supabase.auth.signOut();
                setError("Access Denied: You do not have Resident/Owner privileges.");
            }
        };
        checkSession();
    }, [supabase, router]);

    useEffect(() => {
        return () => { if (lockoutTimer.current) clearInterval(lockoutTimer.current); };
    }, []);

    const startLockout = () => {
        setLockoutRemaining(LOCKOUT_SECONDS);
        lockoutTimer.current = setInterval(() => {
            setLockoutRemaining((prev) => {
                if (prev <= 1) { clearInterval(lockoutTimer.current!); setAttempts(0); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutRemaining > 0) return;
        setLoading(true); setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError || !data.user) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) { startLockout(); throw new Error(`Too many broken attempts. Wait ${LOCKOUT_SECONDS}s.`); }
                throw new Error(authError?.message || "Invalid credentials.");
            }

            setAttempts(0);
            let profile = null;
            for (let i = 0; i < 3; i++) {
                const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
                if (p) { profile = p; break; }
                if (i < 2) await new Promise((r) => setTimeout(r, 800));
            }

            if (!profile || (profile.role !== "GroupAdmin" && profile.role !== "SuperAdmin")) {
                await supabase.auth.signOut();
                throw new Error("Access Denied: Resident access required.");
            }

            router.push("/owner");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
            if (resetError) throw new Error(resetError.message);
            setMode("forgot-sent");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally { setLoading(false); }
    };

    if (redirecting) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4 text-sky-400">
                    <span className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                    <p className="text-sm font-medium">Taking you home…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-900 font-sans selection:bg-sky-500/30">
            <div className="absolute top-[-30%] left-[-15%] w-[900px] h-[900px] bg-sky-600/10 rounded-full blur-[150px] pointer-events-none" />
            
            <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center justify-center px-4 py-8">
                <div className="w-full relative rounded-[28px] bg-slate-800/80 backdrop-blur-2xl border border-sky-500/20 p-7 shadow-2xl">
                    <div className="flex flex-col items-center gap-7 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-400/30 shadow-inner">
                            <Home className="w-8 h-8 text-sky-400" />
                        </div>

                        {mode === "login" && (
                            <div className="w-full flex flex-col items-center">
                                <h1 className="text-[28px] font-extrabold tracking-tight text-white mb-6">Resident Portal</h1>
                                
                                <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                                    {error && <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl">{error}</div>}
                                    <input type="email" placeholder="resident@domain.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 text-white focus:ring-2 focus:ring-sky-500/50 outline-none" />
                                    <div className="relative">
                                        <input type={showPassword?"text":"password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 pr-12 text-white focus:ring-2 focus:ring-sky-500/50 outline-none" />
                                        <button type="button" aria-label="Toggle password visibility" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><Eye className="w-5 h-5"/></button>
                                    </div>
                                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-sky-400 hover:text-sky-300 pt-1">Forgot password?</button>
                                    <button type="submit" disabled={loading} className="w-full h-[52px] rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]">{loading ? "Logging in..." : "Sign In to Dashboard"}</button>
                                </form>
                                <Link href="/" className="mt-6 text-xs font-medium text-slate-500 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
                            </div>
                        )}
                        {/* Simplistic forgot password rendering here */}
                        {mode === "forgot" && (
                            <div className="w-full flex flex-col items-center">
                                <h1 className="text-xl font-bold text-white mb-2">Reset Password</h1>
                                <form onSubmit={handleForgotPassword} className="w-full space-y-4">
                                    <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-[52px] rounded-xl bg-slate-900 border border-slate-700 px-4 text-white focus:ring-sky-500/50" />
                                    <button type="submit" disabled={loading} className="w-full h-[52px] rounded-xl bg-sky-500 text-white font-bold">Send Link</button>
                                    <button type="button" onClick={() => setMode("login")} className="text-xs text-slate-400 pt-2">Cancel</button>
                                </form>
                            </div>
                        )}
                        {mode === "forgot-sent" && (
                            <div className="text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-white font-bold">Reset link sent!</h2>
                                <button onClick={() => setMode("login")} className="mt-6 text-sky-400 text-sm">Back to login</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
