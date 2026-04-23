export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Page Title Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-slate-800 rounded-lg" />
                <div className="h-4 w-72 bg-slate-800/60 rounded" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 space-y-3">
                        <div className="h-4 w-20 bg-slate-700/50 rounded" />
                        <div className="h-8 w-16 bg-slate-700/50 rounded" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/30">
                    <div className="h-5 w-32 bg-slate-700/50 rounded" />
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-800/30">
                        <div className="h-4 w-4 bg-slate-700/40 rounded" />
                        <div className="h-4 flex-1 bg-slate-700/30 rounded" />
                        <div className="h-4 w-24 bg-slate-700/30 rounded" />
                        <div className="h-4 w-16 bg-slate-700/30 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
