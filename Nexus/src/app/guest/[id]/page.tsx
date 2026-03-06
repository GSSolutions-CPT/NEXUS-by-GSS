"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";

export default function GuestPassPage({ params }: { params: { id: string } }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // In a real app, this data would be fetched using the `params.id` from Supabase
    const passData = {
        visitorName: "Alice Martin",
        unitName: "Apt 402",
        hostName: "Sarah Smith",
        validFrom: "Today, 08:00 AM",
        validUntil: "Today, 05:00 PM",
        wiegandPin: "654321098", // 9-digit raw wiegand code
        hasParking: true,
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between pb-8 relative overflow-hidden font-sans">

            {/* Background Glow */}
            <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-sky-900/40 to-transparent pointer-events-none blur-3xl"></div>

            {/* Header Container */}
            <div className="w-full max-w-md px-6 pt-10 pb-6 relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center mb-4 overflow-hidden relative group">
                    <Image src="/logo-192.svg" alt="Logo" width={40} height={40} className="relative z-10 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                    <div className="absolute inset-0 bg-sky-500/10 animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-center mb-1">Nexus Access Pass</h1>
                <p className="text-slate-400 text-sm text-center">Invited by {passData.hostName} ({passData.unitName})</p>
            </div>

            {/* Digital Pass Card */}
            <div className="w-full max-w-sm px-4 relative z-10">
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden relative">

                    {/* Card Accent Line */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500"></div>

                    <div className="p-8 flex flex-col items-center">

                        <h2 className="text-2xl font-bold mb-6 text-white">{passData.visitorName}</h2>

                        {/* QR Code Container */}
                        <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.15)] mb-6 transition-transform hover:scale-105">
                            <QRCode
                                value={passData.wiegandPin}
                                size={200}
                                level="H"
                                className="rounded-lg"
                            />
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Scan at Reader or enter PIN</p>
                            <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 tracking-[0.2em] font-mono text-2xl font-bold text-sky-400 shadow-inner">
                                {passData.wiegandPin}
                            </div>
                        </div>

                        {/* Time Window Details */}
                        <div className="w-full space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Valid From:</span>
                                <span className="font-semibold text-white">{passData.validFrom}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Valid Until:</span>
                                <span className="font-semibold text-rose-400">{passData.validUntil}</span>
                            </div>
                            {passData.hasParking && (
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

            {/* House Rules & Ad Banner */}
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

                {/* Global Security Solutions Upsell / Branding footer */}
                <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-2">Secured Professionally By</p>
                    <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/50 rounded-lg py-2 px-4 transition-colors">
                        <Image src="/logo-192.svg" alt="GSS Logo" width={16} height={16} className="opacity-80 grayscale" />
                        <span className="text-xs font-semibold text-slate-300">Global Security Solutions</span>
                    </a>
                </div>

            </div>

        </div>
    );
}
