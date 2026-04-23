"use client";

import Image from "next/image";
import Link from "next/link";
import { Shield, Home, ShieldCheck } from "lucide-react";

export default function PortalGateway() {
    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#060A14] font-sans selection:bg-sky-500/30">
            {/* Animated background orbs */}
            <div className="absolute top-[-30%] left-[-15%] w-[900px] h-[900px] bg-sky-600/8 rounded-full blur-[150px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[180px] pointer-events-none animate-[pulse_12s_ease-in-out_infinite_2s]" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#060A14_100%)] pointer-events-none" />

            <main className="relative z-10 flex w-full max-w-[500px] flex-col items-center justify-center px-4 py-8">
                <div className="w-full relative">
                    <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-sky-500/25 via-transparent to-indigo-500/25 blur-[1px] pointer-events-none animate-[spin_20s_linear_infinite] bg-[size:200%_200%]" />
                    <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />

                    <div className="w-full relative rounded-[28px] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-2xl border border-white/[0.06] p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(14,165,233,0.05)]">
                        <div className="flex flex-col items-center gap-7 text-center">
                            
                            <div className="relative group">
                                <div className="absolute -inset-3 bg-sky-500/15 rounded-3xl blur-2xl group-hover:bg-sky-400/20 transition-colors duration-700" />
                                <div className="relative p-3.5 rounded-2xl bg-slate-900 border border-white/[0.06] shadow-inner backdrop-blur-sm">
                                    <Image src="/logo-512.svg" alt="Global Security Solutions" width={56} height={56} priority
                                        className="relative z-10 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)] group-hover:drop-shadow-[0_0_30px_rgba(14,165,233,0.7)] transition-all duration-500" />
                                </div>
                            </div>

                            <div className="w-full flex flex-col items-center">
                                <div className="space-y-2 mb-7">
                                    <h1 className="text-[28px] font-extrabold tracking-tight text-white">Nexus Portal</h1>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/80">Select Your Access Gateway</p>
                                </div>

                                <div className="w-full grid grid-cols-1 gap-4 text-left">
                                    
                                    <Link href="/login/admin" className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-900 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20">
                                                <Shield className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">SuperAdmin Gateway</h3>
                                                <p className="text-[11px] text-slate-500">System administrators only</p>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link href="/login/owner" className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-900 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:bg-sky-500/20">
                                                <Home className="w-5 h-5 text-sky-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Resident Portal</h3>
                                                <p className="text-[11px] text-slate-500">Unit owners and tenants</p>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link href="/login/guard" className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Security Terminal</h3>
                                                <p className="text-[11px] text-slate-500">Guard access points</p>
                                            </div>
                                        </div>
                                    </Link>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center relative z-10">
                    <p className="text-[10px] text-slate-500/80 font-medium uppercase tracking-[0.2em] mb-2.5">System Engineered By</p>
                    <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl py-2.5 px-5 transition-all w-max">
                        <Image src="/logo-192.svg" alt="GSS Logo" width={16} height={16} className="opacity-60 grayscale" />
                        <span className="text-xs font-semibold text-slate-400">Global Security Solutions</span>
                    </a>
                </div>
            </main>
        </div>
    );
}

