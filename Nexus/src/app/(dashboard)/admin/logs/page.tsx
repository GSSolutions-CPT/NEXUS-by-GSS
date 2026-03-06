"use client";

import { useState } from "react";

export default function GlobalAuditLogsPage() {
    const [filter, setFilter] = useState("all");

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Global Audit Logs</h1>
                    <p className="text-slate-400 mt-1">Review all system events, visitor access, and administrator actions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export to CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export to PDF
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters & Search */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full md:w-auto">
                        {['all', 'access', 'admin', 'system'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${filter === f ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {f === 'all' ? 'All Events' : f === 'access' ? 'Access Grants' : f === 'admin' ? 'Admin Actions' : 'System Logs'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64 flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <input
                                type="date"
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-300 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all [color-scheme:dark]"
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="relative w-full md:w-64">
                            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                            />
                        </div>
                    </div>

                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="p-4 pl-6">Timestamp</th>
                                <th className="p-4">Event Type</th>
                                <th className="p-4">User / Visitor</th>
                                <th className="p-4">Unit / Scope</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">

                            {/* Row 1 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6 whitespace-nowrap">
                                    <p className="text-sm font-medium text-white">Oct 24, 2023</p>
                                    <p className="text-xs text-slate-500">10:42:15 AM</p>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full w-max">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                        Access Granted
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-slate-700 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-slate-300">G</div>
                                        <span className="text-sm font-medium text-white">John Doe</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-sky-400 font-medium">Apt 402</span>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-slate-300">PIN entry at Main Boom Gate</p>
                                </td>
                            </tr>

                            {/* Row 2 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6 whitespace-nowrap">
                                    <p className="text-sm font-medium text-white">Oct 24, 2023</p>
                                    <p className="text-xs text-slate-500">09:15:00 AM</p>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full w-max">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Admin Action
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-white shadow-sm">PM</div>
                                        <span className="text-sm font-medium text-white">Super Admin</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-400 font-medium italic">Global</span>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-slate-300">Updated Lift Segregation rules for <span className="text-white font-medium">Business Unit B</span></p>
                                </td>
                            </tr>

                            {/* Row 3 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6 whitespace-nowrap">
                                    <p className="text-sm font-medium text-white">Oct 23, 2023</p>
                                    <p className="text-xs text-slate-500">11:59:59 PM</p>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-slate-700 border border-slate-600 text-slate-300 rounded-full w-max">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        System Log
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-slate-500">AI</div>
                                        <span className="text-sm font-medium text-slate-400 italic">System Auto-Revoke</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-sky-400 font-medium">Apt 101</span>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-slate-300">Automatically expired PIN for <span className="text-white font-medium">Sarah Smith</span></p>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
