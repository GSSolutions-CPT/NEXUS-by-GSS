"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface Stats {
    totalVisitors: number;
    activeVisitors: number;
    pendingSync: number;
    unitCount: number;
    userCount: number;
}

interface RecentLog {
    id: string;
    event_type: string;
    actor_name: string;
    details: string;
    created_at: string;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats>({ totalVisitors: 0, activeVisitors: 0, pendingSync: 0, unitCount: 0, userCount: 0 });
    const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [bridgeStatus, setBridgeStatus] = useState<"checking" | "online" | "offline">("checking");
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const now = new Date().toISOString();

        const [visitorsRes, activeRes, pendingRes, unitsRes, usersRes, logsRes] = await Promise.all([
            supabase.from("visitors").select("id", { count: "exact", head: true }),
            supabase.from("visitors").select("id", { count: "exact", head: true })
                .lte("start_time", now).gte("expiry_time", now).neq("status", "Revoked"),
            supabase.from("visitors").select("id", { count: "exact", head: true }).eq("status", "Pending"),
            supabase.from("units").select("id", { count: "exact", head: true }),
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("audit_logs").select("id, event_type, actor_name, details, created_at")
                .order("created_at", { ascending: false }).limit(5),
        ]);

        setStats({
            totalVisitors: visitorsRes.count || 0,
            activeVisitors: activeRes.count || 0,
            pendingSync: pendingRes.count || 0,
            unitCount: unitsRes.count || 0,
            userCount: usersRes.count || 0,
        });
        setRecentLogs(logsRes.data || []);
        setLoading(false);
    }, [supabase]);

    // Ping the C# Bridge to check its status
    const checkBridge = useCallback(async () => {
        setBridgeStatus("checking");
        try {
            const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:5000";
            const res = await fetch(`${bridgeUrl}/health`, { signal: AbortSignal.timeout(3000) });
            setBridgeStatus(res.ok ? "online" : "offline");
        } catch {
            setBridgeStatus("offline");
        }
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        fetchStats();
        checkBridge();
    }, [fetchStats, checkBridge]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" });

    const logIcon = (type: string) => {
        if (type?.toLowerCase().includes("deny") || type?.toLowerCase().includes("revok")) {
            return { bg: "bg-rose-500/20", icon: "text-rose-400", path: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" };
        }
        if (type?.toLowerCase().includes("access") || type?.toLowerCase().includes("entry")) {
            return { bg: "bg-emerald-500/20", icon: "text-emerald-400", path: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" };
        }
        return { bg: "bg-indigo-500/20", icon: "text-indigo-400", path: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" };
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
                    <p className="text-slate-400 mt-1">Real-time monitoring of Nexus & Impro bridge status.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => { fetchStats(); checkBridge(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Active Visitors */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-sky-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Active Visitors</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.activeVisitors}</h3>
                        <span className="text-xs text-slate-500 mb-1">of {stats.totalVisitors} total</span>
                    </div>
                </div>

                {/* Bridge Status */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">C# Bridge Status</p>
                    <div className="flex items-center gap-3 mt-1">
                        {bridgeStatus === "checking" ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <div className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bridgeStatus === "online" ? "bg-emerald-400" : "bg-rose-400"}`} />
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${bridgeStatus === "online" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            </div>
                        )}
                        <h3 className={`text-xl font-bold ${bridgeStatus === "online" ? "text-emerald-400" : bridgeStatus === "offline" ? "text-rose-400" : "text-slate-400"}`}>
                            {bridgeStatus === "checking" ? "Checking..." : bridgeStatus === "online" ? "Online" : "Offline"}
                        </h3>
                    </div>
                </div>

                {/* Units */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Registered Units</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.unitCount}</h3>
                        <span className="text-xs text-slate-500 mb-1">{stats.userCount} users</span>
                    </div>
                </div>

                {/* Pending Sync */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Pending Hardware Sync</p>
                    <div className="flex items-center gap-3 mt-1">
                        <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.pendingSync}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stats.pendingSync === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                            {stats.pendingSync === 0 ? "Queue Empty" : "Queued"}
                        </span>
                    </div>
                </div>

            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                            <Link href="/admin/logs" className="text-sm text-sky-400 hover:text-sky-300 font-medium">View Full Log →</Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : recentLogs.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-8">No activity logged yet.</p>
                            ) : (
                                recentLogs.map(log => {
                                    const icon = logIcon(log.event_type);
                                    return (
                                        <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${icon.bg}`}>
                                                <svg className={`w-5 h-5 ${icon.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-300">
                                                    <span className="font-semibold text-white">{log.actor_name || "System"}</span>
                                                    {" — "}{log.details || log.event_type}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">{log.event_type} • {fmt(log.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Broadcast */}
                    <div className="p-6 rounded-2xl bg-sky-900/10 border border-sky-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                        <h3 className="text-lg font-bold text-white mb-2 relative z-10">Broadcast Announcement</h3>
                        <p className="text-sm text-slate-400 mb-4 relative z-10">Send a priority message to all dashboards.</p>
                        <textarea className="w-full h-24 p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none transition-all relative z-10"
                            placeholder="E.g., Main gate under maintenance tomorrow 2–4 AM..." />
                        <button className="w-full mt-3 py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)] relative z-10">
                            Send Broadcast
                        </button>
                    </div>

                    {/* Quick Links */}
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { href: "/admin/users", label: "User Management" },
                                { href: "/admin/units", label: "Unit Management" },
                                { href: "/admin/logs", label: "Full Audit Logs" },
                            ].map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
                                        <span className="font-medium">{label}</span>
                                        <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
