import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/layout/NotificationBell";
import OwnerCallReceiver from "@/components/intercom/OwnerCallReceiver";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100">

            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
                {/* Top Header — left-padded on mobile for hamburger button */}
                <header className="h-14 md:h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 pl-14 md:pl-8 md:px-8 z-10 sticky top-0 backdrop-blur-md bg-opacity-80">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <h2 className="text-base md:text-xl font-semibold text-white drop-shadow-sm truncate">Nexus Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <NotificationBell />
                        <div className="h-8 w-8 md:h-9 md:w-9 bg-slate-800 rounded-full border border-slate-700 overflow-hidden ml-1 md:ml-2 cursor-pointer transition-transform hover:scale-105">
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
                                <span className="text-xs md:text-sm font-semibold text-white">GSS</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content — smaller padding on mobile */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Subtle Background Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 relative z-10">
                        <OwnerCallReceiver />
                        {children}
                    </div>
                </div>
            </main>

        </div>
    );
}
