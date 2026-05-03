"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCode {
    id: string;
    qr_value: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
}

interface UnitWithQR {
    id: string;
    name: string;
    type: string;
    floor: string | null;
    qr_code: QRCode | null;
    access_groups: { id: number; name: string }[];
    owner: { first_name: string; last_name: string } | null;
}

export default function QRCodesManagementPage() {
    const [units, setUnits] = useState<UnitWithQR[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "active" | "inactive" | "none">("all");
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<UnitWithQR | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/qr-codes");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setUnits(json.units || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); };

    const generateQR = async (unitId: string) => {
        setActionLoading(unitId);
        try {
            const res = await fetch("/api/admin/qr-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unit_id: unitId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            flash("QR code generated successfully");
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(null);
        }
    };

    const bulkGenerate = async () => {
        setActionLoading("bulk");
        try {
            const res = await fetch("/api/admin/qr-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bulk: true }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            flash(json.message || "Bulk generation complete");
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(null);
        }
    };

    const toggleStatus = async (qrId: string, currentStatus: string) => {
        setActionLoading(qrId);
        try {
            const newStatus = currentStatus === "active" ? "inactive" : "active";
            const res = await fetch("/api/admin/qr-codes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qr_id: qrId, status: newStatus }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            flash(`QR code ${newStatus === "active" ? "activated" : "deactivated"}`);
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(null);
        }
    };

    const regenerateQR = async (qrId: string, unitId: string) => {
        if (!confirm("Regenerate this QR code? The old code will stop working immediately.")) return;
        setActionLoading(qrId);
        try {
            const res = await fetch(`/api/admin/qr-codes?id=${qrId}&regenerate=true&unit_id=${unitId}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            flash("QR code regenerated");
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(null);
        }
    };

    const downloadQR = (unit: UnitWithQR) => {
        const svg = document.getElementById(`qr-svg-${unit.id}`);
        if (!svg) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
            canvas.width = 512; canvas.height = 612;
            if (!ctx) return;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 512, 612);
            ctx.drawImage(img, 56, 40, 400, 400);
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(unit.name, 256, 490);
            ctx.font = "16px sans-serif";
            ctx.fillStyle = "#64748b";
            ctx.fillText(unit.qr_code?.qr_value || "", 256, 520);
            ctx.fillText("Nexus Access Control — GSS", 256, 560);
            const link = document.createElement("a");
            link.download = `QR-${unit.name.replace(/\s+/g, "_")}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const filtered = units.filter(u => {
        if (filter === "active" && u.qr_code?.status !== "active") return false;
        if (filter === "inactive" && u.qr_code?.status !== "inactive") return false;
        if (filter === "none" && u.qr_code) return false;
        if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const counts = {
        all: units.length,
        active: units.filter(u => u.qr_code?.status === "active").length,
        inactive: units.filter(u => u.qr_code?.status === "inactive").length,
        none: units.filter(u => !u.qr_code).length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">QR Access Codes</h1>
                    <p className="text-slate-400 mt-1">Manage static QR codes for all 26 unit access tags.</p>
                </div>
                <button onClick={bulkGenerate} disabled={actionLoading === "bulk" || counts.none === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:opacity-50 disabled:hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                    {actionLoading === "bulk" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    )}
                    Generate All ({counts.none} remaining)
                </button>
            </div>

            {/* Alerts */}
            {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium flex items-center gap-3 animate-fade-in">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {success}
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3 animate-fade-in">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Units", value: counts.all, color: "text-white", bg: "bg-slate-800/50" },
                    { label: "Active QR", value: counts.active, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Inactive QR", value: counts.inactive, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "No QR Code", value: counts.none, color: "text-rose-400", bg: "bg-rose-500/10" },
                ].map(s => (
                    <div key={s.label} className={`p-4 rounded-xl border border-slate-700/50 ${s.bg}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
                        <h3 className={`text-2xl font-black ${s.color}`}>{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                <div className="border-b border-slate-700/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40">
                    <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-slate-700/50 w-full sm:w-auto shadow-inner">
                        {(["all", "active", "inactive", "none"] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`flex-1 sm:px-5 py-2 text-sm font-medium rounded-lg transition-all ${filter === f ? "bg-slate-800 text-white shadow-md ring-1 ring-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
                                {f === "none" ? "Missing" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search units..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-900/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner" />
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="p-16 text-center">
                        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Loading QR codes...</p>
                    </div>
                )}

                {/* Grid */}
                {!loading && (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filtered.map(unit => (
                            <div key={unit.id} className="glass-card glass-card-hover p-5 space-y-4 relative overflow-hidden group">
                                {/* Unit Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white">{unit.name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${unit.type === "Business" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                                                {unit.type}
                                            </span>
                                        </div>
                                        {unit.owner && <p className="text-xs text-slate-400 mt-0.5">{unit.owner.first_name} {unit.owner.last_name}</p>}
                                        {unit.floor && <p className="text-xs text-slate-500">Floor {unit.floor}</p>}
                                    </div>
                                    {unit.qr_code && (
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${unit.qr_code.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400 animate-pulse"}`}>
                                            {unit.qr_code.status}
                                        </span>
                                    )}
                                </div>

                                {/* QR Display */}
                                {unit.qr_code ? (
                                    <div className="flex flex-col items-center">
                                        <button onClick={() => setSelectedUnit(unit)} className="bg-white p-3 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all cursor-pointer hover:scale-105">
                                            <QRCodeSVG id={`qr-svg-${unit.id}`} value={unit.qr_code.qr_value} size={140} level="H"
                                                bgColor="#ffffff" fgColor="#0f172a" />
                                        </button>
                                        <code className="text-[10px] text-slate-500 mt-2 font-mono">{unit.qr_code.qr_value}</code>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-6">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border-2 border-dashed border-slate-700 flex items-center justify-center mb-3">
                                            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">No QR code assigned</p>
                                        <button onClick={() => generateQR(unit.id)} disabled={actionLoading === unit.id}
                                            className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-all disabled:opacity-50">
                                            {actionLoading === unit.id ? "Generating..." : "Generate QR"}
                                        </button>
                                    </div>
                                )}

                                {/* Access Groups */}
                                {unit.access_groups.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {unit.access_groups.map(g => (
                                            <span key={g.id} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800/80 border border-slate-700 rounded-md text-slate-400">{g.name}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                {unit.qr_code && (
                                    <div className="flex gap-2 pt-2 border-t border-slate-800/50">
                                        <button onClick={() => downloadQR(unit)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            Download
                                        </button>
                                        <button onClick={() => toggleStatus(unit.qr_code!.id, unit.qr_code!.status)}
                                            disabled={actionLoading === unit.qr_code.id}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${unit.qr_code.status === "active" ? "text-amber-400 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40" : "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"}`}>
                                            {unit.qr_code.status === "active" ? "Deactivate" : "Activate"}
                                        </button>
                                        <button onClick={() => regenerateQR(unit.qr_code!.id, unit.id)}
                                            disabled={actionLoading === unit.qr_code.id}
                                            className="flex-1 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-rose-500/20 hover:border-rose-500/40">
                                            Regenerate
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QR Detail Modal */}
            {selectedUnit && selectedUnit.qr_code && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedUnit(null)} />
                    <div ref={qrRef} className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-md p-8 animate-fade-in overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="flex items-center justify-between mb-6 relative">
                            <h2 className="text-2xl font-bold text-white">{selectedUnit.name}</h2>
                            <button onClick={() => setSelectedUnit(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center space-y-4 relative">
                            <div className="bg-white p-5 rounded-2xl shadow-xl">
                                <QRCodeSVG value={selectedUnit.qr_code.qr_value} size={240} level="H" bgColor="#ffffff" fgColor="#0f172a" />
                            </div>
                            <code className="text-sm text-slate-400 font-mono bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">{selectedUnit.qr_code.qr_value}</code>

                            <div className="w-full space-y-2 pt-4 border-t border-slate-800">
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className={selectedUnit.qr_code.status === "active" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{selectedUnit.qr_code.status.toUpperCase()}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Type</span><span className="text-slate-300">{selectedUnit.type}</span></div>
                                {selectedUnit.owner && <div className="flex justify-between text-sm"><span className="text-slate-500">Owner</span><span className="text-slate-300">{selectedUnit.owner.first_name} {selectedUnit.owner.last_name}</span></div>}
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Created</span><span className="text-slate-300">{new Date(selectedUnit.qr_code.created_at).toLocaleDateString("en-ZA")}</span></div>
                            </div>

                            <button onClick={() => downloadQR(selectedUnit)}
                                className="w-full mt-4 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.5)] text-sm">
                                Download PNG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
