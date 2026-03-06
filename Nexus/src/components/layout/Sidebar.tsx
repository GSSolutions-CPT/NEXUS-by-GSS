"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith("/admin");
    const isOwner = pathname.startsWith("/owner");
    const isGuard = pathname.startsWith("/guard");

    const adminLinks = [
        { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        { href: "/admin/units", label: "Properties & Units", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
        { href: "/admin/users", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
        { href: "/admin/logs", label: "Audit Logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ];

    const ownerLinks = [
        { href: "/owner", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        { href: "/owner/invite", label: "Invite Visitors", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
        { href: "/owner/visitors", label: "Active Passes", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" },
        { href: "/owner/logs", label: "Audit Logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ];

    const guardLinks = [
        { href: "/guard", label: "Gate Station", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    ];

    const links = isAdmin ? adminLinks : isOwner ? ownerLinks : isGuard ? guardLinks : [];

    return (
        <aside className="w-64 flex-shrink-0 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between hidden md:flex">

            <div>
                {/* Logo & Brand */}
                <div className="h-20 flex items-center px-6 border-b border-slate-800">
                    <Link href={isAdmin ? "/admin" : isOwner ? "/owner" : "/guard"} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-400/30 group-hover:bg-sky-500/30 transition-colors">
                            <Image src="/logo-192.svg" alt="GSS Logo" width={20} height={20} className="w-5 h-5 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                        </div>
                        <span className="font-bold text-lg tracking-tight hover:text-sky-400 transition-colors">Nexus Portal</span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>

                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                                </svg>
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Support Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-300 mb-1">Global Security Solutions</h4>
                    <p className="text-[10px] text-slate-400 mb-3">System Maintenance & Support</p>
                    <a href="https://wa.me/27629558559" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-600">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.898-9.892 0-2.64-1.026-5.123-2.893-6.99-1.868-1.868-4.351-2.894-6.991-2.893-5.451 0-9.899 4.452-9.899 9.893 0 1.765.484 3.42 1.401 4.908l-.51 1.863 3.602-.481zm10.749-7.447c-.201-.1-1.189-.588-1.373-.655-.184-.067-.318-.1-.452.1-.133.201-.52.655-.638.789-.117.133-.234.151-.433.05-.199-.1-.849-.313-1.616-.998-.594-.533-.997-1.192-1.115-1.392-.117-.2-.012-.308.087-.408.09-.09.201-.234.3-.351.101-.118.134-.201.201-.334.067-.134.034-.251-.016-.351-.05-.1-.453-1.092-.62-1.496-.164-.396-.33-.342-.452-.349-.117-.006-.251-.007-.384-.007-.134 0-.352.05-.536.251-.185.201-.703.687-.703 1.673 0 .987.72 1.94 8.2 2.583.151.2 5.105 7.788 12.378 8.01 2.43.074 4.885-.865 6.467-2.6.438-.48.438-.89.307-1.096-.131-.206-.484-.313-.884-.513z" /></svg>
                        062 955 8559
                    </a>
                </div>
            </div>
        </aside>
    );
}
