"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { X, UserPlus, Loader2, Trash2, Share2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    role: "SuperAdmin" | "GroupAdmin" | "Guard";
    unit_id: string | null;
    unit_name: string | null;
    email: string;
    last_sign_in: string | null;
    created_at: string;
}

interface UnitOption {
    id: string;
    name: string;
    type: string;
}

export default function UserManagementPage() {
    const [activeRole, setActiveRole] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState<UserProfile["role"]>("GroupAdmin");
    const [unitId, setUnitId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [whatsappShareUrl, setWhatsappShareUrl] = useState(""); // #8
    const [fallbackMessage, setFallbackMessage] = useState(""); // #10
    const [copied, setCopied] = useState(false);

    const supabase = createClient();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/users", {
                headers: { "Authorization": `Bearer ${session?.access_token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to fetch users");
            setUsers(json.users || []);
            setUnitOptions(json.units || []);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");
        setInviteLink("");
        setWhatsappShareUrl("");
        setFallbackMessage("");
        try {
            const method = isEditMode ? "PATCH" : "POST";
            const payload = { 
                id: editingUserId,
                email, 
                firstName, 
                lastName, 
                role, 
                unitId: unitId || null 
            };

            const res = await fetch("/api/admin/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Failed to ${isEditMode ? "update" : "invite"} user`);
            
            if (isEditMode) {
                setSuccessMsg(`User "${firstName} ${lastName}" updated successfully.`);
                resetModal();
                setTimeout(() => setSuccessMsg(null), 3000);
            } else if (data.fallbackMessage) {
                // #10 — Link generation failed but user was created
                setFallbackMessage(data.fallbackMessage);
            } else {
                setInviteLink(data.inviteLink || "");
                setWhatsappShareUrl(data.whatsappShareUrl || ""); // #8
            }
            fetchUsers();
        } catch (err: unknown) {
            if (err instanceof Error) setModalError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete "${userName}"? This permanently removes their account and access.`)) return;
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to delete user");
            setSuccessMsg(`${userName} has been removed.`);
            fetchUsers();
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const openEditModal = (user: UserProfile) => {
        setEditingUserId(user.id);
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email);
        setRole(user.role);
        setUnitId(user.unit_id || "");
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const resetModal = () => {
        setEmail(""); setFirstName(""); setLastName(""); setRole("GroupAdmin"); setUnitId("");
        setModalError(""); setInviteLink(""); setCopied(false); setIsModalOpen(false);
        setIsEditMode(false); setEditingUserId(null);
        setWhatsappShareUrl(""); setFallbackMessage(""); // #8 #10
    };

    // Filtering
    const roleMap: Record<string, string> = { super: "SuperAdmin", group: "GroupAdmin", guard: "Guard" };
    const filteredUsers = users.filter(u => {
        const matchesRole = activeRole === "all" || u.role === roleMap[activeRole];
        const matchesSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const superCount = users.filter(u => u.role === "SuperAdmin").length;
    const groupCount = users.filter(u => u.role === "GroupAdmin").length;
    const guardCount = users.filter(u => u.role === "Guard").length;

    const roleBadge = (r: string) => {
        switch (r) {
            case "SuperAdmin": return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
            case "GroupAdmin": return "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-sky-500/40 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]";
            case "Guard": return "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            default: return "bg-slate-800/50 border-slate-700 text-slate-400";
        }
    };

    const roleLabel = (r: string) => {
        switch (r) {
            case "SuperAdmin": return "Super Admin";
            case "GroupAdmin": return "Group Admin";
            case "Guard": return "Guard";
            default: return r;
        }
    };
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 w-full max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">
                        Manage system administrators, unit owners, and security guards.
                    </p>
                </div>
                <button onClick={() => { resetModal(); setIsModalOpen(true); }}
                    className="group relative flex flex-shrink-0 items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-95 overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <UserPlus className="w-5 h-5 flex-shrink-0 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">Invite User</span>
                </button>
            </div>

            {/* Messages */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg bg-emerald-500/20"><svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        {successMsg}
                    </div>
                </div>
            )}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-bold shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg bg-rose-500/20"><svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        {error}
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="relative group/table container">
                <div className="absolute -inset-1 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-[2rem] blur-xl opacity-50 transition duration-500 group-hover/table:opacity-75"></div>
                <div className="bg-slate-900/70 border border-slate-700/60 rounded-3xl overflow-hidden backdrop-blur-xl relative shadow-2xl shadow-black">

                    {/* Filters */}
                    <div className="border-b border-slate-700/60 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/40 relative z-20">
                        <div className="flex flex-wrap lg:flex-nowrap bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 w-full lg:w-auto shadow-inner gap-1">
                            {[
                                { key: "all", label: `All (${users.length})` },
                                { key: "super", label: `Admins (${superCount})` },
                                { key: "group", label: `Owners (${groupCount})` },
                                { key: "guard", label: `Guards (${guardCount})` },
                            ].map(({ key, label }) => (
                                <button key={key} onClick={() => setActiveRole(key)}
                                    className={`flex-1 sm:px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeRole === key ? "bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 border border-white/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-96 group/search">
                            <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-md opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500"></div>
                            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/search:text-sky-400 transition-colors z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/80 transition-all shadow-inner relative z-10" />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="p-24 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-8">
                                <div className="absolute inset-0 rounded-full border-t-2 border-sky-400 animate-spin"></div>
                                <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin animation-delay-150"></div>
                                <div className="absolute inset-4 rounded-full border-b-2 border-emerald-400 animate-spin animation-delay-300"></div>
                                <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-xl animate-pulse"></div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Syncing Accounts</h3>
                            <p className="text-slate-400 text-sm font-medium">Retrieving secure access profiles...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredUsers.length === 0 && (
                        <div className="p-24 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-sky-500/10 rounded-[2rem] blur-xl pb-2"></div>
                                <UserPlus className="w-10 h-10 text-slate-400 relative z-10" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">No Users Found</h3>
                            <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">It looks a little quiet in this view. Expand your filters or invite a new user to populate this list.</p>
                            <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="mt-8 px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold border border-slate-600 transition-all hover:shadow-xl hover:shadow-black/50 hover:border-slate-500">
                                Invite Someone
                            </button>
                        </div>
                    )}

                    {/* User Table */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-slate-700/60 bg-slate-950/50 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">
                                        <th className="p-5 pl-8">User Profile</th>
                                        <th className="p-5">System Role</th>
                                        <th className="p-5">Assigned Unit</th>
                                        <th className="p-5">Activity Status</th>
                                        <th className="p-5 text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/40">
                                    {filteredUsers.map((u, index) => {
                                        const initials = `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase();
                                        const hasSignedIn = !!u.last_sign_in;

                                        return (
                                            <tr key={u.id} className="group hover:bg-slate-800/50 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                                                <td className="p-5 pl-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-xl tracking-wider">
                                                                {initials}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-[15px] tracking-tight">{u.first_name} {u.last_name}</p>
                                                            <p className="text-[13px] text-slate-400 font-medium mt-0.5">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-[0.5rem] ${roleBadge(u.role)}`}>
                                                        {roleLabel(u.role)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    {u.unit_name ? (
                                                        <span className="text-sm font-bold text-slate-300 inline-flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                                            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                            {u.unit_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 font-bold tracking-widest uppercase bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">—</span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="relative flex h-3 w-3">
                                                            {hasSignedIn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>}
                                                            <div className={`relative inline-flex rounded-full h-3 w-3 shadow-[0_0_10px_currentColor] border ${hasSignedIn ? "bg-emerald-500 border-emerald-400/50 text-emerald-500" : "bg-amber-500 border-amber-400/50 text-amber-500"}`} />
                                                        </div>
                                                        <span className={`text-[11px] font-black tracking-[0.1em] uppercase ${hasSignedIn ? "text-emerald-400" : "text-amber-400"}`}>
                                                            {hasSignedIn ? "Active" : "Pending"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right pr-8 whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <button onClick={() => openEditModal(u)}
                                                            className="text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all p-2.5 border border-transparent hover:border-sky-500/20" title="Edit user">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                                                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all p-2.5 border border-transparent hover:border-rose-500/20" title="Delete user">
                                                            <Trash2 className="w-5 h-5" strokeWidth={2.5} />
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
            </div>

            {/* Invite/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-700/60 shadow-[0_0_80px_rgba(0,0,0,0.8)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 bg-[length:200%_100%] animate-pulse"></div>
                        
                        <div className="p-6 sm:p-8 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30">
                            <h2 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
                                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                                    {isEditMode ? (
                                        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    ) : (
                                        <UserPlus className="w-6 h-6 text-sky-400" />
                                    )}
                                </div>
                                {isEditMode ? "Edit Profile" : "Invite New User"}
                            </h2>
                            <button onClick={resetModal} className="text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 hover:border-slate-600 transition-all" title="Close">
                                <X className="w-6 h-6" strokeWidth={2.5} />
                            </button>
                        </div>

                        {fallbackMessage ? (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-inner">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                                        <p className="text-sm font-black uppercase tracking-widest text-amber-400">Manual Step Required</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-300 leading-relaxed">{fallbackMessage}</p>
                                </div>
                                <button onClick={resetModal} className="w-full py-4 rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-lg hover:shadow-black/50 border border-slate-600 text-[15px]">
                                    Done
                                </button>
                            </div>
                        ) : inviteLink ? (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="p-6 sm:p-8 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/30 shadow-inner relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 p-4 opacity-10"><UserPlus className="w-48 h-48 text-emerald-500" /></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">User Created</p>
                                        </div>
                                        <p className="text-[15px] font-medium text-slate-300 mb-6">
                                            Share this link with <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">{email}</span>.
                                        </p>
                                    </div>
                                    <div className="relative mt-2">
                                        <div className="relative flex items-center">
                                            <input type="text" readOnly value={inviteLink} className="w-full h-14 pl-4 pr-14 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-inner overflow-hidden text-ellipsis whitespace-nowrap" />
                                            <button onClick={copyLink} className={`absolute right-2 p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${copied ? "bg-emerald-500 text-white" : "text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-600"}`}>
                                                {copied ? "COPIED" : "COPY"}
                                            </button>
                                        </div>
                                    </div>
                                    {whatsappShareUrl && (
                                        <a href={whatsappShareUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 mt-5 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-[15px] font-bold transition-all shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:translate-y-0">
                                            <Share2 className="w-5 h-5" /> Share via WhatsApp
                                        </a>
                                    )}
                                    <p className="text-xs font-bold text-amber-500/90 mt-5 flex items-center justify-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Active for 24 hours.</p>
                                </div>
                                <button onClick={resetModal} className="w-full py-4 rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 transition-all shadow-lg text-[15px]">
                                    Finish
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="first-name" className="block text-xs font-black uppercase tracking-widest text-slate-400">First Name <span className="text-rose-500">*</span></label>
                                        <input id="first-name" type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 text-[15px] font-medium focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all shadow-inner hover:border-slate-600" placeholder="Jane" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="last-name" className="block text-xs font-black uppercase tracking-widest text-slate-400">Last Name <span className="text-rose-500">*</span></label>
                                        <input id="last-name" type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 text-[15px] font-medium focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all shadow-inner hover:border-slate-600" placeholder="Smith" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email-address" className="block text-xs font-black uppercase tracking-widest text-slate-400">Email Address {isEditMode ? "(Read-only)" : <span className="text-rose-500">*</span>}</label>
                                    <input id="email-address" type="email" required disabled={isEditMode} value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 text-[15px] font-medium focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all shadow-inner hover:border-slate-600 disabled:opacity-50 disabled:bg-slate-900 disabled:hover:border-slate-700/80" placeholder="jane@example.com" />
                                </div>

                                <div className="space-y-2 border-t border-slate-700/50 pt-6">
                                    <label htmlFor="user-role" className="block text-xs font-black uppercase tracking-widest text-slate-400">System Role <span className="text-rose-500">*</span></label>
                                    <div className="relative group/select">
                                        <select id="user-role" value={role} onChange={e => setRole(e.target.value as UserProfile["role"])}
                                            className="w-full h-12 px-4 pr-12 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white text-[15px] focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all appearance-none shadow-inner font-semibold hover:border-slate-600">
                                            <option value="GroupAdmin">Group Admin (Owner / Tenant)</option>
                                            <option value="Guard">Security Guard</option>
                                            <option value="SuperAdmin">Super Administrator</option>
                                        </select>
                                        <svg className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover/select:text-slate-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {role === "GroupAdmin" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label htmlFor="assigned-unit" className="block text-xs font-black uppercase tracking-widest text-slate-400">
                                            Assign to Unit <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative group/select">
                                            <select id="assigned-unit" value={unitId} onChange={e => setUnitId(e.target.value)} required
                                                className="w-full h-12 px-4 pr-12 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white text-[15px] focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all appearance-none shadow-inner font-semibold hover:border-slate-600">
                                                <option value="">— Select a unit —</option>
                                                {unitOptions.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                                                ))}
                                            </select>
                                            <svg className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover/select:text-slate-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 bg-rose-500/10 w-max px-3 py-1.5 rounded-lg border border-rose-500/20">
                                            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p className="text-[11px] font-bold text-rose-400 tracking-wide">REQUIRED FOR GROUP ADMINS</p>
                                        </div>
                                    </div>
                                )}

                                {modalError && (
                                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 shadow-inner flex items-start gap-3 animate-in fade-in zoom-in-95">
                                        <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-rose-400 text-sm font-bold leading-relaxed">{modalError}</p>
                                    </div>
                                )}

                                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-4">
                                    <button type="button" onClick={resetModal}
                                        className="w-full sm:w-1/3 py-3.5 rounded-xl font-bold text-[15px] bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="w-full sm:w-2/3 py-3.5 rounded-xl font-bold text-[15px] bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 border border-white/10">
                                        {isSubmitting ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                        ) : (
                                            isEditMode ? "Save Changes" : "Create User"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
