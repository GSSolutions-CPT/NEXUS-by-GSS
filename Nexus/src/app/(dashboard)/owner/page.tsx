import Link from "next/link";
import Image from "next/image";

export default function OwnerDashboardPage() {
    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Global Tech Corp (Floor 4)</h1>
                    <p className="text-slate-400 mt-1">Welcome back, John. Manage your visitors and access passes.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/owner/invite" className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Invite Visitor
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Active Passes Today</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">4</h3>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Scheduled for Tomorrow</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">12</h3>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Historical Scans</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">1,492</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Area Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col - Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Your Unit's Recent Activity</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-transparent">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">Alice (Candidate)</span> entered via <span className="font-semibold text-sky-400">Main Boom Gate</span></p>
                                    <p className="text-xs text-slate-500 mt-1">Today, 08:30 AM</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-transparent">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">Bob (Plumber)</span> entered via <span className="font-semibold text-sky-400">Service Lift</span></p>
                                    <p className="text-xs text-slate-500 mt-1">Today, 09:15 AM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col - Admin Tools */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">

                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>

                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-white relative z-10 leading-tight">Secure Your<br />Premises</h3>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative z-10 backdrop-blur-sm border border-white/10">
                                <Image src="/logo-192.svg" alt="GSS Logo" width={24} height={24} className="w-6 h-6 contrast-150 drop-shadow-md" />
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 mb-6 relative z-10">
                            Upgrade your business security with AJAX Alarms and Hikvision CCTV systems, installed by Global Security Solutions.
                        </p>

                        <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 relative z-10">
                            Request a Quote
                        </a>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Community Announcements</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Maintenance</span>
                                </div>
                                <p className="text-sm text-slate-300">The main gate will be under maintenance tomorrow from 2 AM to 4 AM.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
