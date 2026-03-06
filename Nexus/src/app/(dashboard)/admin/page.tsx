export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
                    <p className="text-slate-400 mt-1">Real-time monitoring of Nexus & Impro bridge status.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Global Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Property
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* KPI 1 */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-sky-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Active Visitors</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">124</h3>
                        <span className="text-sm font-medium text-emerald-400 flex items-center mb-1">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            12%
                        </span>
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">C# Bridge Status</p>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <h3 className="text-xl font-bold text-emerald-400">Tunnel Online</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Latency: 42ms</p>
                </div>

                {/* KPI 3 */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Site Capacity (SLP935)</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">8,402</h3>
                        <span className="text-sm text-slate-500 mb-1">/ 100k tags</span>
                    </div>
                </div>

                {/* KPI 4 */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Failed API Syncs</p>
                    <div className="flex items-center gap-3 mt-1">
                        <h3 className="text-3xl font-bold text-white">0</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">Queue Empty</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col - Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Recent Global Activity</h3>
                            <a href="/admin/logs" className="text-sm text-sky-400 hover:text-sky-300 font-medium">View Full Log</a>
                        </div>

                        <div className="space-y-4">
                            {/* Log Item 1 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">John Doe (Guest)</span> entered via <span className="font-semibold text-sky-400">Main Boom Gate</span></p>
                                    <p className="text-xs text-slate-500 mt-1">Invited by Apt 402 • Today, 10:42 AM</p>
                                </div>
                            </div>

                            {/* Log Item 2 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">Super Admin</span> updated Lift Segregation rules for <span className="font-semibold text-sky-400">Business Unit B</span></p>
                                    <p className="text-xs text-slate-500 mt-1">System Audit • Today, 09:15 AM</p>
                                </div>
                            </div>

                            {/* Log Item 3 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">System</span> automatically revoked PIN for <span className="font-semibold text-sky-400">Sarah Smith</span></p>
                                    <p className="text-xs text-slate-500 mt-1">Validity window expired • Yesterday, 11:59 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col - Admin Tools */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-sky-900/10 border border-sky-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

                        <h3 className="text-lg font-bold text-white mb-2 relative z-10">Broadcast Announcement</h3>
                        <p className="text-sm text-slate-400 mb-6 relative z-10">Send a priority message to all Group Admin and Guard dashboards.</p>

                        <textarea
                            className="w-full h-24 p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none transition-all relative z-10"
                            placeholder="E.g., The main gate will be under maintenance tomorrow from 2 AM to 4 AM..."
                        ></textarea>

                        <button className="w-full mt-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)] relative z-10">
                            Send Broadcast
                        </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
                                    <span className="font-medium">Impro Portal Documentation</span>
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
                                    <span className="font-medium">System Troubleshooting</span>
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
