"use client";

import { useState, FormEvent } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";

export default function UserManagementPage() {
    const [activeRole, setActiveRole] = useState("all");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("GroupAdmin");
    const [unitId, setUnitId] = useState(""); // Optionally fetched from units API

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            // Generate a secure random password for them. In production, this might be emailed to them,
            // or we use Supabase magic links. Here we'll generate and store it for demo copy-paste.
            const tempPassword = "Temp" + Math.floor(1000 + Math.random() * 9000) + "!";

            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    password: tempPassword,
                    role,
                    unitId: unitId || null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to invite user");
            }

            setSuccessMsg(`User invited! Temp Password: ${tempPassword}`);

            // Note: We don't close the modal immediately so they can copy the password
            // In a real email-based flow, we would close it.
        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMsg(err.message);
            } else {
                setErrorMsg("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEmail("");
        setFirstName("");
        setLastName("");
        setRole("GroupAdmin");
        setUnitId("");
        setErrorMsg("");
        setSuccessMsg("");
        setIsInviteModalOpen(false);
    };

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-1">Manage system administrators, unit owners, and security guards.</p>
                </div>

                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
                >
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    Invite User
                </button>
            </div>

            {/* Main Content Area (Static Table) */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        {['all', 'super', 'group', 'guard'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setActiveRole(r)}
                                className={`flex-1 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeRole === r ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {r === 'all' ? 'All Roles' : r === 'super' ? 'PMs' : r === 'group' ? 'Owners' : 'Guards'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>

                </div>

                {/* Data Table Preview */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="p-4 pl-6">User / Email</th>
                                <th className="p-4">System Role</th>
                                <th className="p-4">Assigned Unit</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {/* Static Users shown for structural reference */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm opacity-90">
                                            JD
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">John Doe</p>
                                            <p className="text-xs text-slate-400">john@globaltech.co.za</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full">
                                        Group Admin
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-300">Global Tech Corp (B1)</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs font-medium text-slate-300">Active</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 text-sm font-medium">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden relative">

                        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-sky-400" />
                                Invite New User
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-5 space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">First Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text" required
                                        value={firstName} onChange={e => setFirstName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Last Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text" required
                                        value={lastName} onChange={e => setLastName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all"
                                        placeholder="Smith"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Email <span className="text-rose-500">*</span></label>
                                <input
                                    type="email" required
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all"
                                    placeholder="jane@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">System Role <span className="text-rose-500">*</span></label>
                                <select
                                    value={role} onChange={e => setRole(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all appearance-none"
                                >
                                    <option value="GroupAdmin">Group Admin (Owner / Tenant)</option>
                                    <option value="Guard">Security Guard</option>
                                    <option value="SuperAdmin">Super Administrator (Property Manager)</option>
                                </select>
                            </div>

                            {role === "GroupAdmin" && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Assign to Unit UUID (Optional)</label>
                                    <input
                                        type="text"
                                        value={unitId} onChange={e => setUnitId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition-all"
                                        placeholder="E.g. d48c-..."
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">If blank, they will not see any specific Property Visitors.</p>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                                    {errorMsg}
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                                    <div className="font-semibold mb-1 tracking-wide uppercase">Invitation Sent!</div>
                                    <div>{successMsg}</div>
                                    <div className="mt-2 text-[10px] text-emerald-500">Please securely share this temporary password with the user.</div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    {successMsg ? "Close" : "Cancel"}
                                </button>

                                {!successMsg && (
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-2 rounded-lg font-medium text-sm bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create User
                                    </button>
                                )}
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
