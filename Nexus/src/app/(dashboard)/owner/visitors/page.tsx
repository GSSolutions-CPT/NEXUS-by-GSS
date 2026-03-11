"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Visitor {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    start_time: string;
    expiry_time: string;
    needs_parking: boolean;
    status: string;
    pin_code: string;
}

export default function ActiveVisitorsPage() {
    const [filter, setFilter] = useState("active");
    const [search, setSearch] = useState("");
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/visitors");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to fetch visitors");
            setVisitors(json.visitors || []);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchVisitors(); 

        const supabase = createClient();
        let channel: ReturnType<typeof supabase.channel>;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const unitId = user.app_metadata?.user_unit_id;
            const filterStr = unitId ? `unit_id=eq.${unitId}` : undefined;

            channel = supabase
                .channel('visitor-updates')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visitors', filter: filterStr }, (payload) => {
                    setVisitors(prev => prev.map(v => 
                        v.id === payload.new.id ? { ...v, status: payload.new.status } as Visitor : v
                    ));
                })
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [fetchVisitors]);

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`Revoke access for ${name}? They will no longer be able to enter.`)) return;
        setRevoking(id);
        try {
            const res = await fetch(`/api/visitors?id=${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to revoke");
            fetchVisitors();
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setRevoking(null);
        }
    };

    const now = new Date();

    const filteredVisitors = visitors.filter(v => {
        const start = new Date(v.start_time);
        const expiry = new Date(v.expiry_time);

        const matchesFilter = (() => {
            if (filter === "active") return start <= now && expiry >= now && v.status !== "Revoked";
            if (filter === "scheduled") return start > now && v.status !== "Revoked";
            if (filter === "expired") return expiry < now || v.status === "Revoked";
            return true;
        })();

        const matchesSearch = `${v.first_name} ${v.last_name} ${v.phone}`.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusBadge = (v: Visitor) => {
        const start = new Date(v.start_time);
        const expiry = new Date(v.expiry_time);
        if (v.status === "Revoked") return { label: "Revoked", cls: "bg-rose-500/10 border-rose-500/30 text-rose-400", dot: "bg-rose-500" };
        if (v.status === "Pending") return { label: "Pending Sync", cls: "bg-amber-500/10 border-amber-500/30 text-amber-400", dot: "bg-amber-500" };
        if (expiry < now) return { label: "Expired", cls: "bg-slate-500/10 border-slate-500/30 text-slate-400", dot: "bg-slate-500" };
        if (start > now) return { label: "Scheduled", cls: "bg-sky-500/10 border-sky-500/30 text-sky-400", dot: "bg-sky-500" };
        return { label: "Active", cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", dot: "bg-emerald-500" };
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Active Passes</h1>
                    <p className="text-slate-400 mt-1">Manage current and scheduled visitor access to your premises.</p>
                </div>
                <button onClick={fetchVisitors} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">{error}</div>}

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        {[
                            { key: "active", label: `Active (${visitors.filter(v => new Date(v.start_time) <= now && new Date(v.expiry_time) >= now && v.status !== "Revoked").length})` },
                            { key: "scheduled", label: `Scheduled (${visitors.filter(v => new Date(v.start_time) > now && v.status !== "Revoked").length})` },
                            { key: "expired", label: `Expired (${visitors.filter(v => new Date(v.expiry_time) < now || v.status === "Revoked").length})` },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setFilter(key)}
                                className={`flex-1 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${filter === key ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Loading visitors...</p>
                        </div>
                    ) : filteredVisitors.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">No {filter} visitors found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    <th className="p-4 pl-6">Visitor</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Valid From</th>
                                    <th className="p-4">Expires</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredVisitors.map((v) => {
                                    const badge = statusBadge(v);
                                    const canRevoke = v.status !== "Revoked" && new Date(v.expiry_time) >= now;
                                    return (
                                        <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                        {v.first_name?.[0]}{v.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{v.first_name} {v.last_name}</p>
                                                        {v.needs_parking && <p className="text-[10px] text-amber-400">Parking requested</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-300">{v.phone}</td>
                                            <td className="p-4 text-sm text-slate-300">{fmt(v.start_time)}</td>
                                            <td className="p-4 text-sm text-slate-300">{fmt(v.expiry_time)}</td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full w-max ${badge.cls}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {canRevoke && (
                                                    <button onClick={() => handleRevoke(v.id, `${v.first_name} ${v.last_name}`)}
                                                        disabled={revoking === v.id}
                                                        className="text-slate-400 hover:text-rose-400 transition-colors p-2 disabled:opacity-50" title="Revoke Pass">
                                                        {revoking === v.id
                                                            ? <div className="w-4 h-4 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                                                            : <Trash2 className="w-4 h-4" />
                                                        }
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
