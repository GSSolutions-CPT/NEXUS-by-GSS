"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface AccessGroup {
    id: number;
    name: string;
}

interface Unit {
    id: string;
    name: string;
    type: "Business" | "Residential";
    floor: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    created_at: string;
    access_groups: AccessGroup[];
    owner: { first_name: string; last_name: string } | null;
}

export default function UnitsManagementPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [units, setUnits] = useState<Unit[]>([]);
    const [availableGroups, setAvailableGroups] = useState<AccessGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"Business" | "Residential">("Business");
    const [newFloor, setNewFloor] = useState("");
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const supabase = createClient();

    const fetchUnits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/units", {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to fetch units");
            setUnits(json.units || []);
            setAvailableGroups(json.available_access_groups || []);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleAddUnit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await fetch("/api/admin/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    type: newType,
                    floor: newFloor || null,
                    accessGroupIds: selectedGroupIds,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to create unit");
            setSuccessMsg(`Unit "${newName}" created successfully!`);
            setNewName("");
            setNewFloor("");
            setSelectedGroupIds([]);
            setShowModal(false);
            fetchUnits();
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUnit = async (unitId: string, unitName: string) => {
        if (!confirm(`Are you sure you want to delete "${unitName}"? This action cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/admin/units?id=${unitId}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to delete unit");
            fetchUnits();
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const toggleGroup = (id: number) => {
        setSelectedGroupIds(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    // Filter units
    const filteredUnits = units.filter(u => {
        const matchesTab = activeTab === "all" || u.type.toLowerCase() === activeTab;
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.floor || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const businessCount = units.filter(u => u.type === "Business").length;
    const residentialCount = units.filter(u => u.type === "Residential").length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Units & Properties</h1>
                    <p className="text-slate-400 mt-1">Manage businesses, residential units, and their lift segregation rules.</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setError(null); setSuccessMsg(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add New Unit
                </button>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium">{successMsg}</div>
            )}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium">{error}</div>
            )}

            {/* Main Content */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Tabs & Search */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        <button onClick={() => setActiveTab("all")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                            All ({units.length})
                        </button>
                        <button onClick={() => setActiveTab("business")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "business" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                            Business ({businessCount})
                        </button>
                        <button onClick={() => setActiveTab("residential")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "residential" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                            Residential ({residentialCount})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search units..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Loading units...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredUnits.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No units found</h3>
                        <p className="text-sm text-slate-400">Get started by adding your first residential or business unit.</p>
                    </div>
                )}

                {/* Data Table */}
                {!loading && filteredUnits.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    <th className="p-4 pl-6">Unit Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Primary Owner</th>
                                    <th className="p-4">Lift Segregation (Impro Groups)</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredUnits.map((unit) => {
                                    const ownerInitials = unit.owner
                                        ? `${unit.owner.first_name?.[0] || ""}${unit.owner.last_name?.[0] || ""}`
                                        : null;

                                    return (
                                        <tr key={unit.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-sky-500/30 transition-colors">
                                                        <span className="text-xs text-slate-500 font-medium">UNIT</span>
                                                        <span className="font-bold text-white text-sm leading-none mt-0.5">{unit.name}</span>
                                                    </div>
                                                    {unit.floor && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-slate-500 font-medium">FLOOR</span>
                                                            <span className="text-sm text-slate-300">{unit.floor}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-full">
                                                    {unit.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {unit.owner ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">{ownerInitials}</div>
                                                        <span className="text-sm text-slate-300">{unit.owner.first_name} {unit.owner.last_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">No owner assigned</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {unit.access_groups && unit.access_groups.length > 0 ? (
                                                        unit.access_groups.map((g) => (
                                                            <span key={g.id} className="px-2 py-1 text-[10px] font-semibold bg-sky-500/10 border border-sky-500/30 rounded text-sky-400">
                                                                {g.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">No access groups</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6 whitespace-nowrap">
                                                <button
                                                    onClick={() => alert("Edit unit functionality not implemented yet.")}
                                                    className="text-slate-400 hover:text-sky-400 transition-colors p-2 mr-1"
                                                    title="Edit unit"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUnit(unit.id, unit.name)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors p-2"
                                                    title="Delete unit"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Unit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Add New Unit</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Unit Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Unit Name *</label>
                            <input type="text" placeholder="e.g. Apt 402 or Digital Agency Co." value={newName} onChange={(e) => setNewName(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
                            <div className="flex gap-3">
                                <button onClick={() => setNewType("Business")} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${newType === "Business" ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
                                    Business
                                </button>
                                <button onClick={() => setNewType("Residential")} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${newType === "Residential" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
                                    Residential
                                </button>
                            </div>
                        </div>

                        {/* Floor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Floor / Location</label>
                            <input type="text" placeholder="e.g. Floor 4" value={newFloor} onChange={(e) => setNewFloor(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                        </div>

                        {/* Access Groups */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Impro Access Groups</label>
                            <div className="flex flex-wrap gap-2">
                                {availableGroups.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => toggleGroup(g.id)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${selectedGroupIds.includes(g.id) ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"}`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleAddUnit}
                            disabled={isSubmitting || !newName}
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
                        >
                            {isSubmitting ? "Creating..." : "Create Unit"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
