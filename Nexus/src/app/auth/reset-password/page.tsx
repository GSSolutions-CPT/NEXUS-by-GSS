"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Supabase puts the tokens in the URL hash — exchange them on mount
    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            supabase.auth.exchangeCodeForSession(code).catch(() => {
                setError("This reset link has expired or is invalid. Please request a new one.");
            });
        }
    }, [searchParams, supabase]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const { error: updateErr } = await supabase.auth.updateUser({ password });
            if (updateErr) throw new Error(updateErr.message);
            setDone(true);
            setTimeout(() => router.push("/"), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

            <main className="relative z-10 w-full max-w-md p-8">
                <div className="w-full rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <Image src="/logo-512.svg" alt="GSS Logo" width={80} height={80} priority
                            className="drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]" />

                        {done ? (
                            <div className="space-y-3 text-center py-4">
                                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-white">Password Updated</h2>
                                <p className="text-sm text-slate-400">Redirecting you to the login page…</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                                    <p className="text-sm text-slate-400">Choose a strong password for your account.</p>
                                </div>

                                <form onSubmit={handleReset} className="w-full space-y-4 text-left">
                                    {error && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">New Password</label>
                                        <input type="password" placeholder="Minimum 8 characters" value={password}
                                            onChange={e => setPassword(e.target.value)} disabled={loading} required
                                            className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Confirm Password</label>
                                        <input type="password" placeholder="Repeat your password" value={confirm}
                                            onChange={e => setConfirm(e.target.value)} disabled={loading} required
                                            className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:shadow-none active:scale-[0.98]">
                                        {loading
                                            ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            : "Update Password"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
