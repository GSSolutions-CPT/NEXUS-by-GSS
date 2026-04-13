"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Eye, ShieldCheck, ArrowLeft } from "lucide-react";



export default function GuardLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();

            if (profile?.role === "Guard" || profile?.role === "SuperAdmin") {
                router.replace("/guard");
            } else {
                await supabase.auth.signOut();
                setError("Access Denied: You do not have Security Guard privileges.");
            }
        };
        checkSession();
    }, [supabase, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError || !data.user) {
                throw new Error(authError?.message || "Invalid credentials.");
            }

            let profile = null;
            for (let i = 0; i < 3; i++) {
                const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
                if (p) { profile = p; break; }
                if (i < 2) await new Promise((r) => setTimeout(r, 800));
            }

            if (!profile || (profile.role !== "Guard" && profile.role !== "SuperAdmin")) {
                await supabase.auth.signOut();
                throw new Error("Access Denied: Guard credentials required.");
            }

            router.push("/guard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center relative bg-emerald-950 font-sans selection:bg-emerald-500/30">
            <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
            
            <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center justify-center px-4 py-8">
                <div className="w-full relative rounded-2xl bg-emerald-900/60 backdrop-blur-xl border border-emerald-500/30 p-7 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40 mb-6 shadow-inner">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                        </div>

                        <h1 className="text-[26px] font-bold text-white mb-6 tracking-tight">Security Terminal</h1>
                        
                        <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                            {error && <div className="p-3 bg-red-500/20 text-red-300 text-xs rounded-xl font-bold">{error}</div>}
                            <input type="email" placeholder="Guard ID / Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-12 rounded-xl bg-emerald-950 border border-emerald-700/50 px-4 text-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                            <div className="relative">
                                <input type={showPassword?"text":"password"} placeholder="PIN / Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-12 rounded-xl bg-emerald-950 border border-emerald-700/50 px-4 pr-12 text-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-400"><Eye className="w-5 h-5"/></button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black tracking-widest uppercase transition-all mt-4">{loading ? "Verifying..." : "Access Terminal"}</button>
                        </form>

                        <Link href="/" className="mt-8 text-xs font-semibold text-emerald-600 hover:text-emerald-400 flex items-center gap-1 uppercase tracking-wider"><ArrowLeft className="w-3.5 h-3.5" /> General Portal</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
