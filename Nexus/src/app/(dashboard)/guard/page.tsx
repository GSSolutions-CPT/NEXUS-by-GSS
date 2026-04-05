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
            const res = await fetch("/api/guard/pulse-gate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ door: 1, action: "pulse" }),
            });
            if (!res.ok) throw new Error("Bridge proxy failed");
            setBoomStatus("success");
        } catch {
            // Proxy might be offline or bridge unreachable
            setBoomStatus("error");
        } finally {
            setIsOpeningBoom(false);
            setTimeout(() => setBoomStatus("idle"), 4000);
        }
    };

    const filteredDirectory = directory.filter(d =>
        `${d.first_name || ""} ${d.last_name || ""} ${d.unit_name || ""}`.toLowerCase().includes(dirSearch.toLowerCase())
    );

    const fmt = (d: string) => new Date(d).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="space-y-8 animate-fade-in font-sans">

            {activeCall && (
                <GuardCaller 
                    targetUser={activeCall} 
                    onClose={() => setActiveCall(null)} 
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter text-gradient uppercase">Main Gate Station</h1>
                    <p className="text-slate-400 mt-1 font-medium italic">Operational dashboard for mission-critical gate operations.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-bold transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <RefreshCw className="w-4 h-4" /> REFRESH
                    </button>
                    <div className="px-5 py-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.15)] flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        SYSTEM CONNECTED
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left — Controls + Roster */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Boom Gate Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button
                            onClick={handleOpenBoomGate}
                            disabled={isOpeningBoom}
                            className={`p-10 rounded-3xl font-black transition-all flex flex-col items-center justify-center gap-4 text-center group ${boomStatus === "success" ? "bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] border-4 border-emerald-400/50"
                                    : boomStatus === "error" ? "bg-rose-600 text-white shadow-[0_0_40px_rgba(225,29,72,0.5)] border-4 border-rose-500/50"
                                        : "bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-white shadow-[0_15px_40px_-5px_rgba(14,165,233,0.4)] hover:shadow-[0_20px_60px_-10px_rgba(14,165,233,0.5)] hover:-translate-y-2 active:scale-95 border-b-8 border-sky-700 hover:border-sky-600"
                                } disabled:shadow-none disabled:transform-none disabled:border-slate-800`}
                        >
                            <svg className={`w-14 h-14 ${isOpeningBoom ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span className="text-2xl uppercase tracking-tighter">
                                {isOpeningBoom ? "Syncing..." : boomStatus === "success" ? "GATE PULSED" : boomStatus === "error" ? "HARDWARE ERROR" : "OPEN GATE (ENTER)"}
                            </span>
                        </button>

                        <button className="p-10 rounded-3xl bg-slate-900 hover:bg-slate-800 text-slate-100 border-2 border-slate-800 hover:border-rose-500/30 font-black transition-all flex flex-col items-center justify-center gap-4 group active:scale-95">
                            <svg className="w-14 h-14 text-rose-500 group-hover:animate-ping" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-2xl uppercase tracking-tighter text-rose-500">LOCKDOWN MODE</span>
                        </button>
                    </div>

                    {/* Parking Roster */}
                    <div className="glass-card shadow-2xl overflow-hidden animate-fade-in delay-100">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40">
                            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                                <span className="p-2 bg-sky-500/20 rounded-lg"><Megaphone className="w-5 h-5 text-sky-400" /></span>
                                Arrival Manifest — Parking Required
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-sky-500" /> Today
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700/30 bg-slate-950/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                        <th className="p-6">Visitor Information</th>
                                        <th className="p-6">Premises / Unit</th>
                                        <th className="p-6">Time Window</th>
                                        <th className="p-6">Auth Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40 font-medium">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-500">
                                            <div className="flex justify-center mb-4"><span className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" /></div>
                                            <p className="uppercase tracking-widest font-black text-xs">Querying Subspace Manifest...</p>
                                        </td></tr>
                                    ) : visitors.length === 0 ? (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-600">
                                            <p className="uppercase tracking-widest font-black text-sm opacity-50 italic">No visitors scheduled with parking clearance.</p>
                                        </td></tr>
                                    ) : (
                                        visitors.map((v) => (
                                            <tr key={v.id} className="hover:bg-sky-500/[0.03] transition-colors group">
                                                <td className="p-6">
                                                    <p className="text-lg font-black text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{v.first_name} {v.last_name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID Verified</p>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-sm font-black text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 uppercase">{v.unit_name}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-sm text-slate-300 font-bold tabular-nums bg-slate-900/50 px-3 py-1.5 rounded-lg">{fmt(v.start_time)} – {fmt(v.expiry_time)}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border-2 uppercase tracking-widest ${v.status === "Active" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                            : "bg-amber-500/10 border-amber-500/40 text-amber-400"
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
                    <div className="glass-card shadow-2xl overflow-hidden sticky top-28 flex flex-col animate-fade-in delay-200" style={{ height: "calc(100vh - 10rem)" }}>
                        <div className="p-6 border-b border-slate-700/50 bg-slate-900/60 ">
                            <h3 className="font-black text-white uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                Community Intercom
                            </h3>
                            <div className="relative group">
                                <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" placeholder="FILTER BY UNIT OR NAME..." value={dirSearch} onChange={e => setDirSearch(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-950/80 border-2 border-slate-800 text-white placeholder:text-slate-600 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all outline-none" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-12"><div className="w-8 h-8 border-3 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" /></div>
                            ) : filteredDirectory.length === 0 ? (
                                <div className="text-center text-slate-600 text-xs font-bold uppercase tracking-widest py-12 opacity-50">Zero matches in directory.</div>
                            ) : (
                                filteredDirectory.map((d, idx) => (
                                    <div key={d.id} 
                                         className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all group animate-fade-in"
                                         style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="flex justify-between items-center">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="font-black text-white text-base tracking-tighter uppercase">{d.unit_name || "???"}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-lg border border-sky-500/20">Authorized</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold uppercase tracking-tight truncate">{d.first_name} {d.last_name}</p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveCall(d)}
                                                className="w-12 h-12 rounded-2xl bg-sky-500 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 flex-shrink-0 group-hover:scale-105"
                                                title="Initiate Secure Call"
                                            >
                                                <Phone className="w-6 h-6 fill-current animate-pulse-gentle" />
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
