"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface ExpectedVisitor {
    id: string;
    first_name: string;
    last_name: string;
    unit_id: string;
    valid_from: string;
    valid_until: string;
}

export default function GuardDashboardPage() {
    const [isOpeningBoom, setIsOpeningBoom] = useState(false);
    const [visitors, setVisitors] = useState<ExpectedVisitor[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchExpectedVisitors = async () => {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // We only want visitors that need parking and are valid today
            const { data } = await supabase
                .from("visitors")
                .select("*")
                .eq("needs_parking", true)
                .gte("valid_until", startOfDay)
                .lte("valid_from", endOfDay)
                .order("valid_from", { ascending: true });

            if (data) {
                setVisitors(data);
            }
            setLoading(false);
        };
        fetchExpectedVisitors();
    }, [supabase]);

    const handleOpenBoomGate = () => {
        setIsOpeningBoom(true);
        // In production, this calls the hardware bridge API endpoint
        setTimeout(() => {
            alert("Nexus Bridge Command Sent:\n\nTriggering Relay #1\nImpro SDK: driveAction(Door, Pulse/Open)\n\nBoom gate opened successfully!");
            setIsOpeningBoom(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Main Gate Station</h1>
                    <p className="text-slate-400 mt-1">Operational dashboard for verifying arrivals and emergency overrides.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                        System Online
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Urgent Controls - Left Col spanning 2 */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Quick Action Overrides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleOpenBoomGate}
                            disabled={isOpeningBoom}
                            className="p-6 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 flex flex-col items-center justify-center gap-3"
                        >
                            <svg className={`w-10 h-10 ${isOpeningBoom ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            <span className="text-xl">{isOpeningBoom ? "Sending Signal..." : "OPEN BOOM GATE (IN)"}</span>
                        </button>

                        <button
                            className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-3"
                        >
                            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="text-xl">EMERGENCY LOCKDOWN</span>
                        </button>
                    </div>

                    {/* Parking Roster */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                Expected Visitors (Parking Required)
                            </h3>
                            <span className="text-sm text-slate-400">Today</span>
                        </div>
                        <div className="overflow-x-auto min-h-[200px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700/50 bg-slate-900/40 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="p-4">Visitor Name</th>
                                        <th className="p-4">Destination Unit</th>
                                        <th className="p-4">Time Window</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                <div className="flex justify-center mb-2">
                                                    <span className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></span>
                                                </div>
                                                Fetching expected visitors...
                                            </td>
                                        </tr>
                                    ) : visitors.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                No expected visitors needing parking today.
                                            </td>
                                        </tr>
                                    ) : (
                                        visitors.map((v) => {
                                            const from = new Date(v.valid_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const to = new Date(v.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-semibold text-white">{v.first_name} {v.last_name}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm font-medium text-sky-400 bg-sky-500/10 px-2 py-1 rounded">
                                                            Unit {v.unit_id}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-slate-300">{from} - {to}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-semibold text-white transition-colors">
                                                            Mark Arrived
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Col - Directory */}
                <div className="space-y-6">
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm sticky top-28 flex flex-col h-[calc(100vh-10rem)]">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
                            <h3 className="font-bold text-white mb-3">Community Directory</h3>
                            <div className="relative">
                                <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Unit or Name..."
                                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {/* In a real scenario, this would map over user profiles */}
                            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white group-hover:text-sky-400 transition-colors">Apt 101</span>
                                    <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Owner</span>
                                </div>
                                <p className="text-sm text-slate-400 mb-2">Sarah Smith</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        Call
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white group-hover:text-sky-400 transition-colors">Global Tech Corp</span>
                                    <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Business</span>
                                </div>
                                <p className="text-sm text-slate-400 mb-2">Floor 4 Reception</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        Call
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
