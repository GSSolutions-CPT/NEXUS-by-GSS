"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// #5 — Password strength calculator
function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (pw.length === 0) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-400" };
    return { level: 3, label: "Strong", color: "bg-emerald-500" };
}

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [linkExpired, setLinkExpired] = useState(false); // #7
    const [done, setDone] = useState(false);
    const [sessionReady, setSessionReady] = useState(false); // Wait for Supabase to process hash tokens
    const router = useRouter();
    const supabase = createClient();

    // Listen for the PASSWORD_RECOVERY event from Supabase.
    // When a user clicks the reset link, Supabase puts tokens in the URL hash (#access_token=...).
    // The @supabase/ssr client auto-detects these and fires PASSWORD_RECOVERY once the session is set.
    useEffect(() => {
        // First check for error fragments in the hash (e.g. expired links)
        const hash = window.location.hash;
        if (hash.includes("error_description=")) {
            const desc = new URLSearchParams(hash.substring(1)).get("error_description");
            if (desc) {
                setError(desc.replace(/\+/g, " "));
                setLinkExpired(true); // #7
                return; // Don't bother listening for auth events
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                // Session is now set — user can update their password
                setSessionReady(true);
            }
        });

        // Also check if a session already exists (e.g. page refresh after hash was consumed)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
            }
        });

        // Timeout: if no session after 5 seconds, the link is likely expired/invalid
        const timeout = setTimeout(() => {
            if (!linkExpired) {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (!session) {
                        setError("This link has expired or is invalid. Please request a new one.");
                        setLinkExpired(true);
                    }
                });
            }
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const strength = getPasswordStrength(password); // #5

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

            // #6 — After successful reset, the session is already live.
            // Fetch the user's role and redirect directly to their dashboard.
            setTimeout(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single();

                    if (profile?.role === "SuperAdmin") router.push("/admin");
                    else if (profile?.role === "GroupAdmin") router.push("/owner");
                    else if (profile?.role === "Guard") router.push("/guard");
                    else router.push("/");
                } else {
                    router.push("/");
                }
            }, 2000);
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
                                {/* #6 — Redirecting to dashboard, not login */}
                                <p className="text-sm text-slate-400">Logging you into your dashboard…</p>
                                <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mt-2" />
                            </div>
                        ) : linkExpired ? (
                            /* #7 — Expired link UI with action path */
                            <div className="space-y-4 text-center py-2">
                                <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-white">Link Expired</h2>
                                <p className="text-sm text-slate-400">
                                    This reset link has expired or has already been used.
                                    <br />Reset links are valid for <strong className="text-white">24 hours</strong> only.
                                </p>
                                <div className="space-y-2 pt-2">
                                    <Link
                                        href="/"
                                        className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all text-sm"
                                    >
                                        Log in or Request Reset Link
                                    </Link>
                                    <p className="text-[11px] text-slate-500">
                                        Head to the Portal Gateway above to log in or request a new link
                                    </p>
                                </div>
                            </div>
                        ) : !sessionReady ? (
                            /* Loading state while waiting for Supabase to process the tokens */
                            <div className="space-y-3 text-center py-6">
                                <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-slate-400">Verifying your reset link…</p>
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

                                        {/* #5 — Password strength indicator */}
                                        {password.length > 0 && (
                                            <div className="space-y-1 pt-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map((n) => (
                                                        <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.level >= n ? strength.color : "bg-slate-700"}`} />
                                                    ))}
                                                </div>
                                                <p className={`text-[11px] font-semibold ${strength.level === 1 ? "text-rose-400" : strength.level === 2 ? "text-amber-400" : "text-emerald-400"}`}>
                                                    {strength.label} password
                                                </p>
                                            </div>
                                        )}
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

                                    <Link href="/" className="flex items-center justify-center gap-1.5 w-full text-xs text-slate-400 hover:text-slate-200 transition-colors pt-1 group">
                                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                        Back to Portal Gateway
                                    </Link>
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
