"use client";

import { useState } from "react";

export default function UnitsManagementPage() {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Units & Properties</h1>
                    <p className="text-slate-400 mt-1">Manage businesses, residential units, and their lift segregation rules.</p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add New Unit
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Tabs & Filters */}
                <div className="border-b border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                        >
                            All Units
                        </button>
                        <button
                            onClick={() => setActiveTab("business")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "business" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                        >
                            Business (14)
                        </button>
                        <button
                            onClick={() => setActiveTab("residential")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "residential" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                        >
                            Residential (12)
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search units..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        />
                    </div>

                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/20 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="p-4 pl-6">Unit Name</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Primary Owner / Admin</th>
                                <th className="p-4">Lift Segregation (Impro Groups)</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">

                            {/* Row 1 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                            B1
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Global Tech Corp</p>
                                            <p className="text-xs text-slate-500">Floor 4</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-300">Business</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">JD</div>
                                        <span className="text-sm text-slate-300">John Doe</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 text-[10px] font-semibold bg-slate-800 border border-slate-700 rounded text-slate-300">Main Entrance</span>
                                        <span className="px-2 py-1 text-[10px] font-semibold bg-sky-500/10 border border-sky-500/30 rounded text-sky-400">Floor 4 Lift</span>
                                        <button className="px-2 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed rounded text-slate-400 hover:text-white transition-colors">
                                            + Add Group
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-slate-400 hover:text-sky-400 transition-colors p-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                </td>
                            </tr>

                            {/* Row 2 */}
                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                                            R1
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Apt 101</p>
                                            <p className="text-xs text-slate-500">Floor 1</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-300">Residential</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">SS</div>
                                        <span className="text-sm text-slate-300">Sarah Smith</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 text-[10px] font-semibold bg-slate-800 border border-slate-700 rounded text-slate-300">Main Entrance</span>
                                        <span className="px-2 py-1 text-[10px] font-semibold bg-sky-500/10 border border-sky-500/30 rounded text-sky-400">Floor 1 Lift</span>
                                        <button className="px-2 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed rounded text-slate-400 hover:text-white transition-colors">
                                            + Add Group
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-slate-400 hover:text-sky-400 transition-colors p-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>

                {/* Empty State (Hidden currently) */}
                {/*
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No units found</h3>
          <p className="text-sm text-slate-400">Get started by adding your first residential or business unit.</p>
        </div>
        */}

            </div>
        </div>
    );
}
