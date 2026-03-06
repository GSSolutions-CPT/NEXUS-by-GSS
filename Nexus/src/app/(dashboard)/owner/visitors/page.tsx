"use client";

import { useState } from "react";

export default function ActiveVisitorsPage() {
    const [filter, setFilter] = useState("active");

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Active Passes</h1>
                    <p className="text-slate-400 mt-1">Manage current and scheduled visitor access to your premises.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        {['active', 'scheduled', 'expired'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`flex-1 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${filter === status ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {status === 'active' ? 'Active Now' : status === 'scheduled' ? 'Scheduled' : 'Expired'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search visitors..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>

                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="p-4 pl-6">Visitor Name</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Valid From</th>
                                <th className="p-4">Valid Until</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">

                            {/* Row 1 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                                            AM
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Alice Martin</p>
                                            <p className="text-xs text-slate-400">Visitor Parking Requested</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">+27 82 555 1234</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">Today, 08:00 AM</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">Today, 05:00 PM</span>
                                </td>
                                <td className="p-4">
                                    <span className="flex flex-shrink-0 items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full w-max">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                        Active
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="text-slate-400 hover:text-sky-400 transition-colors p-2" title="Resend SMS">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button className="text-slate-400 hover:text-rose-400 transition-colors p-2" title="Revoke Pass">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            {/* Row 2 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                                            BB
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Bob Baker</p>
                                            <p className="text-xs text-slate-400">Deliveries</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">+27 71 222 9876</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">Tomorrow, 10:00 AM</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-slate-300">Tomorrow, 11:00 AM</span>
                                </td>
                                <td className="p-4">
                                    <span className="flex flex-shrink-0 items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full w-max">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        Scheduled
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="text-slate-400 hover:text-sky-400 transition-colors p-2" title="Resend SMS">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button className="text-slate-400 hover:text-rose-400 transition-colors p-2" title="Revoke Pass">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
