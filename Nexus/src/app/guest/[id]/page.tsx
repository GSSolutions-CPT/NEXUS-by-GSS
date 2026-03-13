"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface VisitorPass {
    id: string;
    first_name: string;
    last_name: string;
    pin_code: string;
    start_time: string;
    expiry_time: string;
    needs_parking: boolean;
    status: string;
    unit_id: string;
}

interface UnitInfo {
    name: string;
}

export default function GuestPassPage({ params }: { params: { id: string } }) {
    const [pass, setPass] = useState<VisitorPass | null>(null);
    const [unit, setUnit] = useState<UnitInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        const fetchPass = async () => {
            try {
                const { data: visitor, error: visErr } = await supabase
                    .from("visitors")
                    .select("id, first_name, last_name, pin_code, start_time, expiry_time, needs_parking, status, unit_id")
                    .eq("id", params.id)
                    .single();

                if (visErr || !visitor) {
                    setError("Pass not found. Please check your link or contact the property owner.");
                    return;
                }

                setPass(visitor);

                // Fetch unit name for display
                if (visitor.unit_id) {
                    const { data: unitData } = await supabase
                        .from("units")
                        .select("name")
                        .eq("id", visitor.unit_id)
                        .single();
                    if (unitData) setUnit(unitData);
                }
            } catch {
                setError("Unable to load your pass. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPass();
    }, [params.id, supabase]);

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Loading your pass...</p>
                </div>
            </div>
        );
    }

    if (error || !pass) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Pass Not Found</h1>
                    <p className="text-slate-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const now = new Date();
    const expiry = new Date(pass.expiry_time);
    const start = new Date(pass.start_time);
    const isExpired = expiry < now || pass.status === "Revoked";
    const isNotStarted = start > now;

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between pb-8 relative overflow-hidden font-sans">

            {/* Background Glow */}
            <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-sky-900/40 to-transparent pointer-events-none blur-3xl" />

            {/* Header */}
            <div className="w-full max-w-md px-6 pt-10 pb-6 relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center mb-4 overflow-hidden relative">
                    <Image src="/logo-192.svg" alt="Logo" width={40} height={40} className="relative z-10 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                    <div className="absolute inset-0 bg-sky-500/10 animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-center mb-1">Nexus Access Pass</h1>
                <p className="text-slate-400 text-sm text-center">
                    {unit ? `Invited by ${unit.name}` : "Digital access credential"}
                </p>
            </div>

            {/* Pass Card */}
            <div className="w-full max-w-sm px-4 relative z-10">
                <div className={`bg-slate-900/80 backdrop-blur-md rounded-3xl border shadow-2xl overflow-hidden relative ${isExpired ? "border-rose-500/30" : "border-slate-700/50"}`}>

                    <div className={`h-1.5 w-full bg-gradient-to-r ${isExpired ? "from-rose-600 via-rose-500 to-rose-600" : "from-sky-500 via-indigo-500 to-sky-500"}`} />

                    <div className="p-8 flex flex-col items-center">

                        {/* Status banner if expired/revoked/not started */}
                        {(isExpired || isNotStarted) && (
                            <div className={`w-full mb-6 py-2 px-4 rounded-xl text-center text-sm font-semibold ${isExpired ? "bg-rose-500/10 border border-rose-500/30 text-rose-400" : "bg-amber-500/10 border border-amber-500/30 text-amber-400"}`}>
                                {pass.status === "Revoked" ? "⛔ This pass has been revoked" : isExpired ? "⚠️ This pass has expired" : "🕐 Pass not yet valid"}
                            </div>
                        )}

                        <h2 className="text-2xl font-bold mb-6 text-white">{pass.first_name} {pass.last_name}</h2>

                        {/* QR Code */}
                        <div className={`bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.15)] mb-6 transition-transform hover:scale-105 ${isExpired ? "opacity-40 grayscale" : ""}`}>
                            <QRCode
                                value={pass.pin_code}
                                size={200}
                                level="H"
                                className="rounded-lg"
                            />
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Scan at Reader or enter PIN</p>
                            <div className={`bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 tracking-[0.2em] font-mono text-2xl font-bold shadow-inner ${isExpired ? "text-slate-600" : "text-sky-400"}`}>
                                {pass.pin_code}
                            </div>
                        </div>

                        {/* Time Window Details */}
                        <div className="w-full space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Valid From:</span>
                                <span className="font-semibold text-white">{fmt(pass.start_time)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Valid Until:</span>
                                <span className={`font-semibold ${isExpired ? "text-rose-400" : "text-white"}`}>{fmt(pass.expiry_time)}</span>
                            </div>
                            {pass.needs_parking && (
                                <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-800/50 mt-1">
                                    <span className="text-slate-400">Visitor Parking:</span>
                                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Approved
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* House Rules & Branding */}
            <div className="w-full max-w-sm px-6 mt-8 relative z-10 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        House Rules
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                        <li>Please present this pass to security if asked.</li>
                        <li>Do not park in reserved bays.</li>
                        <li>Speed limit strictly 15 km/h.</li>
                    </ul>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-2">Secured Professionally By</p>
                    <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/50 rounded-lg py-2 px-4 transition-colors">
                        <Image src="/logo-192.svg" alt="GSS Logo" width={16} height={16} className="opacity-80 grayscale" />
                        <span className="text-xs font-semibold text-slate-300">Global Security Solutions</span>
                    </a>
                    
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs">
                        <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <span className="text-slate-700">•</span>
                        <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
