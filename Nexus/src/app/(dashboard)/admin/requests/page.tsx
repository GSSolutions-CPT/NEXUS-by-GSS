"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Smartphone, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Phone, Mail, User, Building2 } from "lucide-react";

type RequestStatus = "Pending" | "In Progress" | "Completed" | "Rejected";

interface TagRequest {
    id: string;
    created_at: string;
    assignee_first_name: string;
    assignee_last_name: string;
    assignee_role: string;
    assignee_phone: string;
    assignee_email: string | null;
    notes: string | null;
    status: RequestStatus;
    unit_id: string;
    unit_name?: string;
    requested_by_name?: string;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
    "Pending":    { label: "Pending",     color: "text-amber-400 bg-amber-500/10 border-amber-500/30",   icon: <Clock className="w-3.5 h-3.5" /> },
    "In Progress":{ label: "In Progress", color: "text-sky-400 bg-sky-500/10 border-sky-500/30",         icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    "Completed":  { label: "Completed",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    "Rejected":   { label: "Rejected",    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",      icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminCredentialRequestsPage() {
    const [requests, setRequests] = useState<TagRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<RequestStatus | "All">("All");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("tag_requests")
            .select("*, units(name), profiles(first_name, last_name)")
            .order("created_at", { ascending: false });

        if (!error && data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRequests(data.map((r: any) => ({
                ...r,
                unit_name: r.units?.name || "Unknown Unit",
                requested_by_name: r.profiles
                    ? `${r.profiles.first_name || ""} ${r.profiles.last_name || ""}`.trim()
                    : "Unknown",
            })));
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const updateStatus = async (id: string, newStatus: RequestStatus) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from("tag_requests")
            .update({ status: newStatus })
            .eq("id", id);

        if (!error) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        }
        setUpdatingId(null);
    };

    const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

    const counts = {
        All: requests.length,
        Pending: requests.filter(r => r.status === "Pending").length,
        "In Progress": requests.filter(r => r.status === "In Progress").length,
        Completed: requests.filter(r => r.status === "Completed").length,
        Rejected: requests.filter(r => r.status === "Rejected").length,
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">STID Credential Requests</h1>
                    <p className="text-slate-400 mt-1">Review and action mobile credential requests from unit owners.</p>
                </div>
                <button onClick={fetchRequests} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700 w-max">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(["All", "Pending", "In Progress", "Completed", "Rejected"] as const).map(tab => (
                    <button key={tab} onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            filter === tab
                                ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                                : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white"
                        }`}>
                        {tab}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${
                            filter === tab ? "bg-sky-500/30 text-sky-300" : "bg-slate-700 text-slate-400"
                        }`}>
                            {counts[tab]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No {filter !== "All" ? filter.toLowerCase() : ""} requests</p>
                    <p className="text-slate-600 text-sm mt-1">Requests from unit owners will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(req => {
                        const statusCfg = STATUS_CONFIG[req.status];
                        return (
                            <div key={req.id} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                                        <Smartphone className="w-6 h-6 text-sky-400" />
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    {req.assignee_first_name} {req.assignee_last_name}
                                                </h3>
                                                <p className="text-sm text-slate-400 capitalize">{req.assignee_role}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                                                {statusCfg.icon}
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Meta */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>{req.assignee_phone}</span>
                                            </div>
                                            {req.assignee_email && (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                    <span className="truncate">{req.assignee_email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>{req.unit_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>Requested by {req.requested_by_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 text-xs sm:col-span-2">
                                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                {fmt(req.created_at)}
                                            </div>
                                        </div>

                                        {req.notes && (
                                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-sm text-slate-400 italic">
                                                &ldquo;{req.notes}&rdquo;
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                                        {req.status === "Pending" && (
                                            <button onClick={() => updateStatus(req.id, "In Progress")}
                                                disabled={updatingId === req.id}
                                                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                                {updatingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Start Processing"}
                                            </button>
                                        )}
                                        {req.status === "In Progress" && (
                                            <button onClick={() => updateStatus(req.id, "Completed")}
                                                disabled={updatingId === req.id}
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                                {updatingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Mark Complete"}
                                            </button>
                                        )}
                                        {(req.status === "Pending" || req.status === "In Progress") && (
                                            <button onClick={() => updateStatus(req.id, "Rejected")}
                                                disabled={updatingId === req.id}
                                                className="px-4 py-2 bg-slate-700 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-sm font-semibold rounded-lg transition-colors border border-slate-600 disabled:opacity-50">
                                                Reject
                                            </button>
                                        )}
                                        {(req.status === "Completed" || req.status === "Rejected") && (
                                            <span className="text-xs text-slate-600 text-center">No actions</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
