import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100">

            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
                {/* Top Header */}
                <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10 sticky top-0 backdrop-blur-md bg-opacity-80">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-white drop-shadow-sm">Nexus Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative">
                            <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                        <div className="h-9 w-9 bg-slate-800 rounded-full border border-slate-700 overflow-hidden ml-2 cursor-pointer transition-transform hover:scale-105">
                            {/* Avatar placeholder */}
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">JD</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Subtle Background Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                        {children}
                    </div>
                </div>
            </main>

        </div>
    );
}
