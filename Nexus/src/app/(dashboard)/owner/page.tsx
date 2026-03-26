"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Megaphone, AlertTriangle, Info, BellRing } from "lucide-react";

interface OwnerStats {
    activeToday: number;
    scheduledTomorrow: number;
    totalVisitors: number;
    unitName: string;
    ownerName: string;
}

interface RecentLog {
    id: string;
    event_type: string;
    actor_name: string;
    details: string;
    created_at: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string;
    created_at: string;
    profiles?: { first_name: string; last_name: string } | null;
}

export default function OwnerDashboardPage() {
    const [stats, setStats] = useState<OwnerStats>({
        activeToday: 0, scheduledTomorrow: 0, totalVisitors: 0,
        unitName: "", ownerName: "",
    });
    const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, unit_id")
            .eq("id", user.id)
            .single();

        if (!profile) return;

        const unitId = profile.unit_id;
        const ownerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Owner";

        // Fetch unit name
        let unitName = "Your Unit";
        if (unitId) {
            const { data: unit } = await supabase.from("units").select("name").eq("id", unitId).single();
            if (unit) unitName = unit.name;
        }

        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        const tomorrowStart = new Date(now); tomorrowStart.setDate(now.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setHours(23, 59, 59, 999);

        // Factory function: each call returns an independent query builder
        const mkQuery = () => unitId
            ? supabase.from("visitors").select("id", { count: "exact", head: true }).eq("unit_id", unitId)
            : null;

        const [activeRes, scheduledRes, totalRes, logsRes, announcementsRes] = await Promise.all([
            mkQuery()?.lte("start_time", todayEnd.toISOString()).gte("expiry_time", todayStart.toISOString()).neq("status", "Revoked"),
            mkQuery()?.gte("start_time", tomorrowStart.toISOString()).lte("start_time", tomorrowEnd.toISOString()).neq("status", "Revoked"),
            mkQuery(),
            unitId
                ? supabase.from("audit_logs").select("id, event_type, actor_name, details, created_at")
                    .eq("unit_id", unitId).order("created_at", { ascending: false }).limit(5)
                : Promise.resolve({ data: [] }),
            supabase.from("announcements").select("*, profiles(first_name, last_name)").order("created_at", { ascending: false }).limit(5)
        ]);

        setStats({
            activeToday: activeRes?.count || 0,
            scheduledTomorrow: scheduledRes?.count || 0,
            totalVisitors: totalRes?.count || 0,
            unitName,
            ownerName,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRecentLogs((logsRes as any)?.data || []);
        setAnnouncements(announcementsRes.data || []);
        setLoading(false);
    }, [supabase]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => { fetchData(); }, [fetchData]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" });

    const [currentTime, setCurrentTime] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeEmergencies = useMemo(() => {
        return announcements.filter(a => a.type === "emergency" && new Date(a.created_at).getTime() > currentTime - 48 * 60 * 60 * 1000);
    }, [announcements, currentTime]);

    return (
        <div className="space-y-6">

            {/* Emergency Banners */}
            {activeEmergencies.length > 0 && (
                <div className="space-y-3">
                    {activeEmergencies.map(em => (
                        <div key={em.id} className="p-4 md:p-6 bg-rose-500/10 border-2 border-rose-500/50 rounded-2xl flex items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                            <div className="p-3 bg-rose-500/20 rounded-xl">
                                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-rose-500 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl md:text-2xl font-black text-rose-500 uppercase tracking-tight mb-1">{em.title}</h3>
                                <p className="text-rose-200/90 font-medium text-sm md:text-base leading-relaxed">{em.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {loading ? "Loading..." : stats.unitName || "Your Unit"}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Welcome back{stats.ownerName ? `, ${stats.ownerName}` : ""}. Manage your visitors and access passes.
                    </p>
                </div>
                <Link href="/owner/invite" className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] w-max">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Invite Visitor
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Active Passes Today</p>
                    <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.activeToday}</h3>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Scheduled for Tomorrow</p>
                    <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.scheduledTomorrow}</h3>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Visitors (All Time)</p>
                    <h3 className="text-3xl font-bold text-white">{loading ? "—" : stats.totalVisitors}</h3>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Feed & Notice Board */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Notice Board */}
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                                <BellRing className="w-5 h-5 text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Notice Board</h3>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-800/40 rounded-xl animate-pulse" />)}
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-slate-500 text-sm">No recent announcements.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map(ann => (
                                    <div key={ann.id} className={`p-4 rounded-xl border ${ann.type === 'emergency' ? 'bg-rose-500/10 border-rose-500/30' : ann.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                                        <div className="flex items-start gap-3">
                                            {ann.type === 'emergency' ? <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" /> : ann.type === 'warning' ? <Megaphone className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />}
                                            <div>
                                                <h4 className={`font-bold ${ann.type === 'emergency' ? 'text-rose-400' : 'text-white'}`}>{ann.title}</h4>
                                                <p className="text-sm text-slate-300 mt-1">{ann.content}</p>
                                                <p className="text-xs text-slate-500 mt-2">{fmt(ann.created_at)} • From {ann.profiles?.first_name} {ann.profiles?.last_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Your Unit&apos;s Recent Activity</h3>
                            <Link href="/owner/logs" className="text-sm text-sky-400 hover:text-sky-300 font-medium">View All →</Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : recentLogs.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 text-sm">No activity yet.</p>
                                    <Link href="/owner/invite" className="text-sky-400 hover:text-sky-300 text-sm mt-2 inline-block">Invite your first visitor →</Link>
                                </div>
                            ) : (
                                recentLogs.map(log => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
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
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* GSS Upsell */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-white relative z-10 leading-tight">Secure Your<br />Premises</h3>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative z-10 backdrop-blur-sm border border-white/10">
                                <Image src="/logo-192.svg" alt="GSS Logo" width={24} height={24} className="w-6 h-6 contrast-150 drop-shadow-md" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-6 relative z-10">
                            Upgrade your business security with AJAX Alarms and Hikvision CCTV systems.
                        </p>
                        <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer"
                            className="block w-full text-center py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 relative z-10">
                            Request a Quote
                        </a>
                    </div>

                    {/* Quick Links */}
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { href: "/owner/visitors", label: "Active Passes" },
                                { href: "/owner/invite", label: "Invite a Visitor" },
                                { href: "/owner/logs", label: "Access Logs" },
                                { href: "/owner/request", label: "Request NFC Tag" },
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
