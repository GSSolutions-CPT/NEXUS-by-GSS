"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle2 } from "lucide-react";

interface Notification {
    id: string;
    type: "warning" | "info" | "error";
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

function timeAgo(ts: string): string {
    const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (!res.ok) return;
            const json = await res.json();
            setNotifications(json.notifications || []);
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, read: true })
            });
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
        try {
            await Promise.all(unreadIds.map(id => 
                fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, read: true })
                })
            ));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const typeIcon = (type: Notification["type"]) => {
        switch (type) {
            case "error": return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
            case "warning": return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
            default: return <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />;
        }
    };

    const typeBorder = (type: Notification["type"]) => {
        switch (type) {
            case "error": return "border-l-rose-500/50";
            case "warning": return "border-l-amber-500/50";
            default: return "border-l-sky-500/50";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative"
                aria-label="Notifications"
            >
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
                <Bell className="w-6 h-6" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-900">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-white">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">{unreadCount}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchNotifications} title="Refresh"
                                className={`p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800 ${loading ? "animate-spin" : ""}`}>
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-sky-400 transition-colors font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-5 h-5 text-slate-500" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">All clear!</p>
                                <p className="text-xs text-slate-500 mt-1">No active alerts at this time.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`flex gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors border-l-2 ${typeBorder(n.type)} ${n.read ? "opacity-50" : "bg-sky-500/[0.02]"}`}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                >
                                    {typeIcon(n.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${n.read ? "text-slate-400" : "text-white"}`}>{n.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.id.startsWith('temp-') ? n.created_at : n.created_at)}</p>
                                    </div>
                                    {!n.read && (
                                        <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                            className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5 shadow-sm"
                                            title="Mark as Read"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/50">
                            <p className="text-[10px] text-slate-500 text-center">Persistence enabled across devices</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
