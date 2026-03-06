"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface AuditLog {
    id: string;
    created_at: string;
    event_type: string;
    actor_name: string;
    details: string;
    unit_id?: string;
}

export default function GlobalAuditLogsPage() {
    const [filter, setFilter] = useState("all");
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) {
                setLogs(data);
            }
            setLoading(false);
        };
        fetchLogs();
    }, [supabase]);

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.event_type.toLowerCase().includes(filter);
    });

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Global Audit Logs</h1>
                    <p className="text-slate-400 mt-1">Review all system events, visitor access, and administrator actions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export to CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export to PDF
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters & Search */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full md:w-auto">
                        {['all', 'access', 'admin', 'system'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${filter === f ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {f === 'all' ? 'All Events' : f === 'access' ? 'Access Grants' : f === 'admin' ? 'Admin Actions' : 'System Logs'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64 flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <input
                                type="date"
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-300 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all [color-scheme:dark]"
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="relative w-full md:w-64">
                            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                            />
                        </div>
                    </div>

                </div>

                {/* Data Table */}
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="p-4 pl-6">Timestamp</th>
                                <th className="p-4">Event Type</th>
                                <th className="p-4">User / Visitor</th>
                                <th className="p-4">Unit / Scope</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">

                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center mb-2">
                                            <span className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></span>
                                        </div>
                                        Fetching global audit logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No audit logs found for the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const dateObj = new Date(log.created_at);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="p-4 pl-6 whitespace-nowrap">
                                                <p className="text-sm font-medium text-white">{dateObj.toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500">{dateObj.toLocaleTimeString()}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full w-max ${log.event_type === 'access' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                        log.event_type === 'admin' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                                            'bg-slate-700 border-slate-600 text-slate-300'
                                                    }`}>
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                                        log.event_type === 'access' ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" :
                                                            log.event_type === 'admin' ? "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" :
                                                                "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    } /></svg>
                                                    {log.event_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-slate-700 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-slate-300">
                                                        {log.actor_name ? log.actor_name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="text-sm font-medium text-white">{log.actor_name || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-sky-400 font-medium">{log.unit_id ? `Unit ${log.unit_id}` : 'Global'}</span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-slate-300">{log.details}</p>
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
    );
}
