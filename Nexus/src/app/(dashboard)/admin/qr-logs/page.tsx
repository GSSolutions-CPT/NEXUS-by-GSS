"use client";

import { useState, useEffect, useCallback } from "react";

interface QRLog {
    id: string;
    access_point: string;
    event_type: "entry" | "exit" | "denied";
    scanned_at: string;
    metadata: Record<string, unknown>;
    units: { id: string; name: string; type: string } | null;
    qr_codes: { id: string; qr_value: string; status: string } | null;
}

interface UnitOption {
    id: string;
    name: string;
}

export default function QRActivityLogsPage() {
    const [logs, setLogs] = useState<QRLog[]>([]);
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [unitFilter, setUnitFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const limit = 25;

    const fetchUnits = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/qr-codes");
            const json = await res.json();
            if (json.units) {
                setUnits(json.units.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })));
            }
        } catch { /* units are optional for filtering */ }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (unitFilter) params.set("unit_id", unitFilter);
            if (fromDate) params.set("from", new Date(fromDate).toISOString());
            if (toDate) params.set("to", new Date(toDate + "T23:59:59").toISOString());

            const res = await fetch(`/api/admin/qr-logs?${params}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setLogs(json.logs || []);
            setTotal(json.total || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, unitFilter, fromDate, toDate, limit]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);
    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.ceil(total / limit);

    const eventConfig = {
        entry: { label: "Entry", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" },
        exit: { label: "Exit", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
        denied: { label: "Denied", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                    QR Access Activity
                </h1>
                <p className="text-slate-400 mt-1">Real-time log of QR code scans across all access points.</p>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: total, color: "text-white", bg: "bg-slate-800/50" },
                    { label: "Entries", value: logs.filter(l => l.event_type === "entry").length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Exits", value: logs.filter(l => l.event_type === "exit").length, color: "text-sky-400", bg: "bg-sky-500/10" },
                    { label: "Denied", value: logs.filter(l => l.event_type === "denied").length, color: "text-rose-400", bg: "bg-rose-500/10" },
                ].map(s => (
                    <div key={s.label} className={`p-4 rounded-xl border border-slate-700/50 ${s.bg}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
                        <h3 className={`text-2xl font-black ${s.color}`}>{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                <div className="border-b border-slate-700/50 p-5 flex flex-col md:flex-row md:items-end gap-4 bg-slate-900/40">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                        <select
                            value={unitFilter}
                            onChange={e => { setUnitFilter(e.target.value); setPage(1); }}
                            className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-slate-700/80 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        >
                            <option value="">All Units</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => { setFromDate(e.target.value); setPage(1); }}
                            className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-slate-700/80 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => { setToDate(e.target.value); setPage(1); }}
                            className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-slate-700/80 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setUnitFilter(""); setFromDate(""); setToDate(""); setPage(1); }}
                        className="h-11 px-5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-bold border border-slate-700/50 transition-all whitespace-nowrap"
                    >
                        Clear
                    </button>
                </div>

                {/* Log List */}
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Loading access logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Access Logs Found</h3>
                        <p className="text-slate-400 text-sm">No QR scan events match your current filters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {logs.map(log => {
                            const config = eventConfig[log.event_type] || eventConfig.entry;
                            return (
                                <div key={log.id} className="flex items-center gap-4 p-4 md:p-5 hover:bg-slate-800/30 transition-colors group animate-fade-in">
                                    {/* Event icon */}
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border} transition-transform group-hover:scale-110`}>
                                        <svg className={`w-5 h-5 md:w-6 md:h-6 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                                        </svg>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
                                                {log.units?.name || "Unknown Unit"}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                                            {log.access_point}
                                            {log.qr_codes && <span className="text-slate-600"> • {log.qr_codes.qr_value}</span>}
                                        </p>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                        <p className="text-xs font-mono text-slate-400">{fmt(log.scanned_at)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-700/50 p-4 flex items-center justify-between bg-slate-900/40">
                        <p className="text-xs text-slate-500 font-medium">
                            Page {page} of {totalPages} — {total} total events
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
