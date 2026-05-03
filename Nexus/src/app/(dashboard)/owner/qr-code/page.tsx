"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRData {
    unit: { id: string; name: string; type: string; floor: string | null };
    qr_code: { id: string; qr_value: string; status: string; created_at: string } | null;
    access_groups: { id: number; name: string }[];
    owner: { first_name: string; last_name: string };
}

interface AccessLog {
    id: string;
    access_point: string;
    event_type: "entry" | "exit" | "denied";
    scanned_at: string;
}

export default function OwnerQRCodePage() {
    const [data, setData] = useState<QRData | null>(null);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    const fetchQR = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/owner/qr-code");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setData(json);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load QR code");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await fetch("/api/owner/qr-logs?limit=10");
            const json = await res.json();
            if (res.ok) setLogs(json.logs || []);
        } catch { /* non-critical */ } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => { fetchQR(); fetchLogs(); }, [fetchQR, fetchLogs]);

    const downloadQR = () => {
        if (!data?.qr_code) return;
        const svg = document.getElementById("owner-qr-svg");
        if (!svg) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
            canvas.width = 512; canvas.height = 640;
            if (!ctx) return;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 512, 640);
            ctx.drawImage(img, 56, 40, 400, 400);
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(data.unit.name, 256, 500);
            ctx.font = "16px monospace";
            ctx.fillStyle = "#64748b";
            ctx.fillText(data.qr_code!.qr_value, 256, 535);
            ctx.font = "14px sans-serif";
            ctx.fillText("Nexus Access Control — GSS", 256, 580);
            ctx.fillText(`Owner: ${data.owner.first_name} ${data.owner.last_name}`, 256, 605);
            const link = document.createElement("a");
            link.download = `AccessQR-${data.unit.name.replace(/\s+/g, "_")}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const copyQRValue = async () => {
        if (!data?.qr_code) return;
        try {
            await navigator.clipboard.writeText(data.qr_code.qr_value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { /* clipboard may not be available */ }
    };

    const shareQR = async () => {
        if (!data?.qr_code) return;
        // Use Web Share API if available (mobile)
        if (navigator.share) {
            try {
                // Try to share the QR image
                const svg = document.getElementById("owner-qr-svg");
                if (svg) {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = async () => {
                            canvas.width = 512; canvas.height = 512;
                            if (ctx) {
                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(0, 0, 512, 512);
                                ctx.drawImage(img, 56, 56, 400, 400);
                            }
                            try {
                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
                                if (blob) {
                                    const file = new File([blob], `QR-${data.unit.name}.png`, { type: "image/png" });
                                    await navigator.share({
                                        title: `${data.unit.name} — Access QR Code`,
                                        text: `Access QR Code for ${data.unit.name}\nCode: ${data.qr_code!.qr_value}`,
                                        files: [file],
                                    });
                                    setShared(true);
                                    setTimeout(() => setShared(false), 2500);
                                }
                            } catch {
                                // Fallback: share without file
                                await navigator.share({
                                    title: `${data.unit.name} — Access QR Code`,
                                    text: `Access QR Code for ${data.unit.name}: ${data.qr_code!.qr_value}`,
                                });
                                setShared(true);
                                setTimeout(() => setShared(false), 2500);
                            }
                            resolve();
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                    });
                }
            } catch { /* user cancelled share */ }
        } else {
            // Fallback: copy to clipboard
            copyQRValue();
        }
    };

    const eventConfig: Record<string, { label: string; text: string; icon: string }> = {
        entry: { label: "Entry", text: "text-emerald-400", icon: "M11 16l-4-4m0 0l4-4m-4 4h14" },
        exit: { label: "Exit", text: "text-sky-400", icon: "M17 16l4-4m0 0l-4-4m4 4H7" },
        denied: { label: "Denied", text: "text-rose-400", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" },
    };

    const fmt = (d: string) => new Date(d).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading your access QR code...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Unable to Load QR Code</h2>
                <p className="text-slate-400 text-sm text-center max-w-sm">{error}</p>
                <a href="https://wa.me/27629558559" target="_blank" rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                    Contact GSS Support
                </a>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">My Access QR Code</h1>
                <p className="text-slate-400 mt-1">Present this QR code at access points for entry to your designated areas.</p>
            </div>

            {/* QR Card */}
            {data.qr_code ? (
                <div className="glass-card p-8 relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                    {/* Status Banner */}
                    <div className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-xl w-max ${data.qr_code.status === "active" ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
                        <div className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.qr_code.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${data.qr_code.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        </div>
                        <span className={`text-sm font-bold ${data.qr_code.status === "active" ? "text-emerald-400" : "text-amber-400"}`}>
                            {data.qr_code.status === "active" ? "Active — Ready to Scan" : "Inactive — Contact Admin"}
                        </span>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center space-y-5 relative">
                        <div className="bg-white p-6 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_50px_rgba(14,165,233,0.3)] transition-shadow">
                            <QRCodeSVG id="owner-qr-svg" value={data.qr_code.qr_value} size={280} level="H" bgColor="#ffffff" fgColor="#0f172a" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white">{data.unit.name}</h2>
                            <code className="text-xs text-slate-500 font-mono mt-1 block">{data.qr_code.qr_value}</code>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8">
                        <button onClick={downloadQR}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.5)] text-sm uppercase tracking-wider">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Download
                        </button>
                        <button onClick={copyQRValue}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 text-sm uppercase tracking-wider">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            {copied ? "Copied!" : "Copy Code"}
                        </button>
                        <button onClick={shareQR}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 text-sm uppercase tracking-wider">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            {shared ? "Shared!" : "Share"}
                        </button>
                    </div>

                    {/* Copied/Shared toast */}
                    {(copied || shared) && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium text-center animate-fade-in">
                            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {copied ? "QR code value copied to clipboard" : "QR code shared successfully"}
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800/80 border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No QR Code Assigned</h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">Your unit does not have a QR code yet. Please contact your property administrator to have one generated.</p>
                    <a href="https://wa.me/27629558559" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors border border-slate-700">
                        Contact GSS Support
                    </a>
                </div>
            )}

            {/* Unit Details */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Access Details</h3>
                <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                        <span className="text-sm text-slate-500">Unit</span>
                        <span className="text-sm text-white font-medium">{data.unit.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                        <span className="text-sm text-slate-500">Type</span>
                        <span className="text-sm text-white font-medium">{data.unit.type}</span>
                    </div>
                    {data.unit.floor && (
                        <div className="flex justify-between py-2 border-b border-slate-800/50">
                            <span className="text-sm text-slate-500">Floor</span>
                            <span className="text-sm text-white font-medium">{data.unit.floor}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                        <span className="text-sm text-slate-500">Owner</span>
                        <span className="text-sm text-white font-medium">{data.owner.first_name} {data.owner.last_name}</span>
                    </div>
                    {data.access_groups.length > 0 && (
                        <div className="pt-2">
                            <span className="text-sm text-slate-500 block mb-2">Access Zones</span>
                            <div className="flex flex-wrap gap-2">
                                {data.access_groups.map(g => (
                                    <span key={g.id} className="px-3 py-1 text-xs font-semibold bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-300">{g.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Access Activity */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Recent Access Activity</h3>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last 10 Events</span>
                </div>

                {logsLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-sm text-slate-500">No QR scan activity recorded yet.</p>
                        <p className="text-xs text-slate-600 mt-1">Events will appear here once your QR code is scanned at an access point.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map(log => {
                            const config = eventConfig[log.event_type] || eventConfig.entry;
                            return (
                                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800/50`}>
                                        <svg className={`w-4 h-4 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{log.access_point}</p>
                                        <p className="text-xs text-slate-500">{fmt(log.scanned_at)}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase ${config.text}`}>{config.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-500 leading-relaxed">
                    <strong className="text-slate-400">Important:</strong> This QR code is a permanent access credential for your unit.
                    Do not share it with unauthorized individuals. If you believe your QR code has been compromised,
                    contact your property administrator immediately to have it regenerated.
                </p>
            </div>
        </div>
    );
}
