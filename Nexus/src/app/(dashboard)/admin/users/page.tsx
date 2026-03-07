"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { X, UserPlus, Loader2, Trash2 } from "lucide-react";
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
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("GroupAdmin");
    const [unitId, setUnitId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [inviteLink, setInviteLink] = useState("");
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

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");
        setInviteLink("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, firstName, lastName, role, unitId: unitId || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to invite user");
            setInviteLink(data.inviteLink || "");
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

    const resetModal = () => {
        setEmail(""); setFirstName(""); setLastName(""); setRole("GroupAdmin"); setUnitId("");
        setModalError(""); setInviteLink(""); setCopied(false); setIsModalOpen(false);
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
            case "SuperAdmin": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
            case "GroupAdmin": return "bg-sky-500/10 border-sky-500/30 text-sky-400";
            case "Guard": return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
            default: return "bg-slate-800 border-slate-700 text-slate-400";
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
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-1">Manage system administrators, unit owners, and security guards.</p>
                </div>
                <button onClick={() => { setIsModalOpen(true); setModalError(""); setInviteLink(""); setCopied(false); }}
                    className="flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    Invite User
                </button>
            </div>

            {/* Messages */}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium">{successMsg}</div>}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium">{error}</div>}

            {/* Table */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        {[
                            { key: "all", label: `All (${users.length})` },
                            { key: "super", label: `Admins (${superCount})` },
                            { key: "group", label: `Owners (${groupCount})` },
                            { key: "guard", label: `Guards (${guardCount})` },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setActiveRole(key)}
                                className={`flex-1 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeRole === key ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all" />
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Loading users...</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && filteredUsers.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <UserPlus className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
                        <p className="text-sm text-slate-400">Invite your first user to get started.</p>
                    </div>
                )}

                {/* User Table */}
                {!loading && filteredUsers.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    <th className="p-4 pl-6">User / Email</th>
                                    <th className="p-4">System Role</th>
                                    <th className="p-4">Assigned Unit</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredUsers.map((u) => {
                                    const initials = `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase();
                                    const hasSignedIn = !!u.last_sign_in;

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{u.first_name} {u.last_name}</p>
                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full ${roleBadge(u.role)}`}>
                                                    {roleLabel(u.role)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {u.unit_name ? (
                                                    <span className="text-sm text-slate-300">{u.unit_name}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${hasSignedIn ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                    <span className="text-xs font-medium text-slate-300">{hasSignedIn ? "Active" : "Pending"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <button onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors p-2" title="Delete user">
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Invite Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">

                        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-sky-400" />
                                Invite New User
                            </h2>
                            <button onClick={resetModal} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {inviteLink ? (
                            /* Success State — Invite Link */
                            <div className="p-5 space-y-4">
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">✓ User Created — Send This Link</p>
                                    <p className="text-xs text-slate-300">
                                        Share this magic link with <span className="font-semibold text-white">{email}</span>. They click it to set their own password and log in.
                                    </p>
                                    <div className="relative">
                                        <textarea
                                            readOnly
                                            value={inviteLink}
                                            rows={3}
                                            className="w-full p-3 rounded-lg bg-slate-900/70 border border-slate-700 text-xs text-slate-300 font-mono resize-none focus:outline-none"
                                        />
                                        <button
                                            onClick={copyLink}
                                            className={`mt-2 w-full py-2 rounded-lg text-xs font-semibold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
                                        >
                                            {copied ? "✓ Copied!" : "Copy Link"}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500">Tip: Send via WhatsApp or email. The link expires after 24 hours.</p>
                                </div>
                                <button onClick={resetModal} className="w-full py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={handleInvite} className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">First Name <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all" placeholder="Jane" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Last Name <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all" placeholder="Smith" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Email <span className="text-rose-500">*</span></label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all" placeholder="jane@example.com" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">System Role <span className="text-rose-500">*</span></label>
                                    <select value={role} onChange={e => setRole(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all appearance-none">
                                        <option value="GroupAdmin">Group Admin (Owner / Tenant)</option>
                                        <option value="Guard">Security Guard</option>
                                        <option value="SuperAdmin">Super Administrator</option>
                                    </select>
                                </div>

                                {role === "GroupAdmin" && unitOptions.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Assign to Unit</label>
                                        <select value={unitId} onChange={e => setUnitId(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all appearance-none">
                                            <option value="">— No unit —</option>
                                            {unitOptions.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-500 mt-1">Optional. Links this admin to a specific property unit.</p>
                                    </div>
                                )}

                                {modalError && (
                                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{modalError}</div>
                                )}

                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={resetModal}
                                        className="flex-1 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="flex-1 py-2 rounded-lg font-medium text-sm bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create User
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
