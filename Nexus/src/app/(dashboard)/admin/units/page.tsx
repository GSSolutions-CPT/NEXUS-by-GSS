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
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const method = isEditMode ? "PATCH" : "POST";
            const payload = {
                id: editingUnitId,
                name: newName,
                type: newType,
                floor: newFloor || null,
                accessGroupIds: selectedGroupIds,
            };

            const res = await fetch("/api/admin/units", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `Failed to ${isEditMode ? "update" : "create"} unit`);
            
            setSuccessMsg(`Unit "${newName}" ${isEditMode ? "updated" : "created"} successfully!`);
            resetModal();
            fetchUnits();
            setTimeout(() => setSuccessMsg(null), 4000);
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
            setSuccessMsg(`Unit "${unitName}" deleted successfully.`);
            fetchUnits();
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const openEditModal = (unit: Unit) => {
        setEditingUnitId(unit.id);
        setNewName(unit.name);
        setNewType(unit.type);
        setNewFloor(unit.floor || "");
        setSelectedGroupIds(unit.access_groups?.map(g => g.id) || []);
        setIsEditMode(true);
        setShowModal(true);
        setError(null);
        setSuccessMsg(null);
    };

    const resetModal = () => {
        setNewName("");
        setNewType("Business");
        setNewFloor("");
        setSelectedGroupIds([]);
        setShowModal(false);
        setIsEditMode(false);
        setEditingUnitId(null);
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

    // Generate type badge classes
    const getTypeBadgeClasses = (type: string) => {
        switch (type) {
            case "Business":
                return "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]";
            case "Residential":
                return "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
            default:
                return "bg-slate-800 border-slate-700 text-slate-300";
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">Units & Properties</h1>
                    <p className="text-slate-400 mt-1">Manage businesses, residential units, and their lift segregation rules.</p>
                </div>
                <button
                    onClick={() => { resetModal(); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add New Unit
                </button>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">

                {/* Tabs & Search */}
                <div className="border-b border-slate-700/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40">
                    <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-slate-700/50 w-full sm:w-auto shadow-inner">
                        <button onClick={() => setActiveTab("all")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "all" ? "bg-slate-800 text-white shadow-md ring-1 ring-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
                            All ({units.length})
                        </button>
                        <button onClick={() => setActiveTab("business")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "business" ? "bg-slate-800 text-white shadow-md ring-1 ring-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
                            Business ({businessCount})
                        </button>
                        <button onClick={() => setActiveTab("residential")} className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "residential" ? "bg-slate-800 text-white shadow-md ring-1 ring-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
                            Residential ({residentialCount})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-72 group">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search units..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-900/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-16 text-center">
                        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                        <p className="text-slate-400 text-sm">Loading units...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredUnits.length === 0 && (
                    <div className="p-16 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-5 shadow-lg">
                            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No units found</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">Get started by adding your first residential or business unit to manage its access groups.</p>
                    </div>
                )}

                {/* Data Table */}
                {!loading && filteredUnits.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/30 text-xs uppercase tracking-wider text-slate-400 font-semibold h-12">
                                    <th className="p-4 pl-6">Unit Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Primary Owner</th>
                                    <th className="p-4">Lift Segregation (Impro Groups)</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredUnits.map((unit, index) => {
                                    const ownerInitials = unit.owner
                                        ? `${unit.owner.first_name?.[0] || ""}${unit.owner.last_name?.[0] || ""}`
                                        : null;

                                    return (
                                        <tr key={unit.id} className="hover:bg-slate-800/40 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationFillMode: 'both', animationDelay: `${Math.min(index * 50, 500)}ms` }}>
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-sky-500/50 group-hover:bg-sky-500/10 transition-all shadow-sm">
                                                        <span className="text-[10px] text-slate-400 font-bold tracking-wider">UNIT</span>
                                                        <span className="font-bold text-white text-sm leading-none mt-0.5">{unit.name}</span>
                                                    </div>
                                                    {unit.floor && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Floor</span>
                                                            <span className="text-sm text-slate-300 font-medium">{unit.floor}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1.5 text-xs font-bold border rounded-full uppercase tracking-wider ${getTypeBadgeClasses(unit.type)}`}>
                                                    {unit.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {unit.owner ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">{ownerInitials}</div>
                                                        <span className="text-sm font-medium text-slate-200">{unit.owner.first_name} {unit.owner.last_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">No owner assigned</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {unit.access_groups && unit.access_groups.length > 0 ? (
                                                        unit.access_groups.map((g) => (
                                                            <span key={g.id} className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800/80 border border-slate-700 rounded-md text-slate-300 shadow-sm whitespace-nowrap">
                                                                {g.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[11px] text-slate-500 italic bg-slate-800/30 px-2 py-1 rounded-md border border-slate-700/30">No groups</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(unit)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all border border-transparent hover:border-sky-500/20"
                                                        title="Edit unit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUnit(unit.id, unit.name)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                                        title="Delete unit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Unit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetModal} />
                    
                    <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg p-7 space-y-6 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
                        
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                                    {isEditMode ? "Edit Unit" : "Add New Unit"}
                                </h2>
                                <button onClick={resetModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all" title="Close Modal">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-5 mt-6">
                                {/* Unit Name */}
                                <div>
                                    <label htmlFor="unit-name" className="block text-sm font-semibold text-slate-300 mb-1.5 text-shadow-sm">Unit Name *</label>
                                    <input id="unit-name" type="text" placeholder="e.g. Apt 402 or Digital Agency Co." value={newName} onChange={(e) => setNewName(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner" />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1.5 text-shadow-sm">Type *</label>
                                    <div className="flex gap-3">
                                        <button onClick={() => setNewType("Business")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all ${newType === "Business" ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                                            Business
                                        </button>
                                        <button onClick={() => setNewType("Residential")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all ${newType === "Residential" ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                                            Residential
                                        </button>
                                    </div>
                                </div>

                                {/* Floor */}
                                <div>
                                    <label htmlFor="unit-floor" className="block text-sm font-semibold text-slate-300 mb-1.5 text-shadow-sm">Floor / Location</label>
                                    <input id="unit-floor" type="text" placeholder="e.g. Floor 4" value={newFloor} onChange={(e) => setNewFloor(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner" />
                                </div>

                                {/* Access Groups */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2 text-shadow-sm flex items-center justify-between">
                                        <span>Impro Access Groups</span>
                                        <span className="text-xs font-normal text-slate-500">{selectedGroupIds.length} selected</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {availableGroups.length > 0 ? availableGroups.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => toggleGroup(g.id)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${selectedGroupIds.includes(g.id) ? "bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.15)]" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800"}`}
                                            >
                                                {g.name}
                                            </button>
                                        )) : (
                                            <div className="text-sm text-slate-500 italic p-3 border border-slate-800 rounded-xl w-full text-center bg-slate-950/30">
                                                No access groups available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="mt-8 pt-5 border-t border-slate-800/80 flex justify-end gap-3">
                                <button
                                    onClick={resetModal}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !newName}
                                    className="px-7 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:shadow-none transform hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center gap-2"
                                >
                                    {isSubmitting && (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    )}
                                    {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Unit")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
