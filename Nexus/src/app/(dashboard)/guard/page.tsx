"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { RefreshCw, Phone } from "lucide-react";
import GuardCaller from "@/components/intercom/GuardCaller";

interface ExpectedVisitor {
    id: string;
    first_name: string;
    last_name: string;
    unit_id: string;
    unit_name?: string;
    start_time: string;
    expiry_time: string;
    needs_parking: boolean;
    status: string;
}

interface DirectoryEntry {
    id: string;
    first_name: string;
    last_name: string;
    unit_id: string;
    unit_name?: string;
    phone?: string;
}

export default function GuardDashboardPage() {
    const [isOpeningBoom, setIsOpeningBoom] = useState(false);
    const [boomStatus, setBoomStatus] = useState<"idle" | "success" | "error">("idle");
    const [visitors, setVisitors] = useState<ExpectedVisitor[]>([]);
    const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
    const [dirSearch, setDirSearch] = useState("");
    const [activeCall, setActiveCall] = useState<DirectoryEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);

        // Fetch today's parking visitors using correct column names
        const { data: visitorData } = await supabase
            .from("visitors")
            .select("id, first_name, last_name, unit_id, start_time, expiry_time, needs_parking, status")
            .eq("needs_parking", true)
            .gte("expiry_time", startOfDay.toISOString())
            .lte("start_time", endOfDay.toISOString())
            .neq("status", "Revoked")
            .order("start_time", { ascending: true });

        // Fetch unit names so we can show useful labels instead of raw UUIDs
        const { data: units } = await supabase.from("units").select("id, name");
        const unitMap: Record<string, string> = {};
        (units || []).forEach(u => { unitMap[u.id] = u.name; });

        setVisitors((visitorData || []).map(v => ({ ...v, unit_name: unitMap[v.unit_id] || "Unknown Unit" })));

        // Fetch community directory (GroupAdmin profiles)
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, unit_id")
            .eq("role", "GroupAdmin")
            .order("last_name", { ascending: true });

        setDirectory((profiles || []).map(p => ({ ...p, unit_name: unitMap[p.unit_id || ""] || "" })));
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenBoomGate = async () => {
        setIsOpeningBoom(true);
        setBoomStatus("idle");
        try {
            const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:5000";
            const res = await fetch(`${bridgeUrl}/api/opendoor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ door: 1, action: "pulse" }),
            });
            if (!res.ok) throw new Error("Bridge returned an error");
            setBoomStatus("success");
        } catch {
            // Bridge might be offline — still show feedback
            setBoomStatus("error");
        } finally {
            setIsOpeningBoom(false);
            setTimeout(() => setBoomStatus("idle"), 4000);
        }
    };

    const filteredDirectory = directory.filter(d =>
        `${d.first_name} ${d.last_name} ${d.unit_name}`.toLowerCase().includes(dirSearch.toLowerCase())
    );

    const fmt = (d: string) => new Date(d).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="space-y-6">

            {activeCall && (
                <GuardCaller 
                    targetUser={activeCall} 
                    onClose={() => setActiveCall(null)} 
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Main Gate Station</h1>
                    <p className="text-slate-400 mt-1">Operational dashboard for verifying arrivals and emergency overrides.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-sm transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        System Online
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left — Controls + Roster */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Boom Gate Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleOpenBoomGate}
                            disabled={isOpeningBoom}
                            className={`p-6 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-3 ${boomStatus === "success" ? "bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
                                    : boomStatus === "error" ? "bg-rose-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
                                        : "bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5"
                                } disabled:shadow-none disabled:transform-none`}
                        >
                            <svg className={`w-10 h-10 ${isOpeningBoom ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span className="text-xl">
                                {isOpeningBoom ? "Sending Signal..." : boomStatus === "success" ? "✓ Gate Opened!" : boomStatus === "error" ? "Bridge Offline" : "OPEN BOOM GATE (IN)"}
                            </span>
                        </button>

                        <button className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-3">
                            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-xl">EMERGENCY LOCKDOWN</span>
                        </button>
                    </div>

                    {/* Parking Roster */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                Expected Visitors — Parking Required
                            </h3>
                            <span className="text-sm text-slate-400">Today</span>
                        </div>
                        <div className="overflow-x-auto min-h-[200px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700/50 bg-slate-900/40 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="p-4">Visitor</th>
                                        <th className="p-4">Unit</th>
                                        <th className="p-4">Time Window</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">
                                            <div className="flex justify-center mb-2"><span className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" /></div>
                                            Fetching expected visitors...
                                        </td></tr>
                                    ) : visitors.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No visitors requiring parking today.</td></tr>
                                    ) : (
                                        visitors.map((v) => (
                                            <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-semibold text-white">{v.first_name} {v.last_name}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-medium text-sky-400 bg-sky-500/10 px-2 py-1 rounded">{v.unit_name}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-slate-300">{fmt(v.start_time)} – {fmt(v.expiry_time)}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${v.status === "Active" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                        }`}>{v.status}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right — Community Directory */}
                <div className="space-y-6">
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm sticky top-28 flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
                        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
                            <h3 className="font-bold text-white mb-3">Community Directory & Intercom</h3>
                            <div className="relative">
                                <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" placeholder="Name or unit..." value={dirSearch} onChange={e => setDirSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="text-center text-slate-500 text-sm py-8">Loading...</div>
                            ) : filteredDirectory.length === 0 ? (
                                <div className="text-center text-slate-500 text-sm py-8">No results found.</div>
                            ) : (
                                filteredDirectory.map(d => (
                                    <div key={d.id} className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white text-sm">{d.unit_name || "No Unit"}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Owner</span>
                                                </div>
                                                <p className="text-sm text-slate-400">{d.first_name} {d.last_name}</p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveCall(d)}
                                                className="w-10 h-10 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(14,165,233,0.1)] hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] active:scale-95 flex-shrink-0"
                                                title="Call Tenant"
                                            >
                                                <Phone className="w-5 h-5 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
