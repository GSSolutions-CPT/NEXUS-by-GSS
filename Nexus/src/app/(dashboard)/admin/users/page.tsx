"use client";

import { useState } from "react";

export default function UserManagementPage() {
    const [activeRole, setActiveRole] = useState("all");

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-1">Manage system administrators, unit owners, and security guards.</p>
                </div>

                <button className="flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Invite User
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        {['all', 'super', 'group', 'guard'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveRole(role)}
                                className={`flex-1 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeRole === role ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {role === 'all' ? 'All Roles' : role === 'super' ? 'PMs' : role === 'group' ? 'Owners' : 'Guards'}
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

                {/* Data Table */}
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

                            {/* User 1 */}
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
                                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        <span className="text-sm text-slate-300">Global Tech Corp (B1)</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-xs font-medium text-slate-300">Active</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 text-sm font-medium">
                                        Edit
                                    </button>
                                </td>
                            </tr>

                            {/* User 2 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm opacity-90">
                                            JS
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">James Security</p>
                                            <p className="text-xs text-slate-400">guard1@gss.co.za</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                                        Guard
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-500 italic">Global Access</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-xs font-medium text-slate-300">Active</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 text-sm font-medium">
                                        Edit
                                    </button>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
