"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function InviteVisitorPage() {
    const [inviteType, setInviteType] = useState("single");

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [validFrom, setValidFrom] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [needsParking, setNeedsParking] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const visitorPayload = {
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                validFrom: new Date(validFrom).toISOString(),
                validUntil: new Date(validUntil).toISOString(),
                needsParking: needsParking
            };

            const res = await fetch("/api/visitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitorPayload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to invite visitor. System might be offline.");
            }

            setSuccessMsg("Visitor successfully invited! Credential is being pushed to the gates.");

            // Clear form
            setFirstName("");
            setLastName("");
            setPhone("");
            setValidFrom("");
            setValidUntil("");
            setNeedsParking(false);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Invite Visitors</h1>
                    <p className="text-slate-400 mt-1">Generate dynamic credentials for your guests to access the premises.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column - Forms */}
                <div className="flex-1 space-y-6">

                    {/* Invite Type Switch */}
                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 w-full max-w-sm">
                        <button
                            onClick={() => setInviteType("single")}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${inviteType === "single" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Single Guest
                        </button>
                        <button
                            onClick={() => setInviteType("bulk")}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${inviteType === "bulk" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Bulk Upload
                        </button>
                    </div>

                    {/* Single Invite Form */}
                    {inviteType === "single" && (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {error && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold rounded-lg text-center">
                                        {error}
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-lg text-center">
                                        {successMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">First Name</label>
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jan" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Last Name</label>
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Van Der Merwe" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Mobile Number (For SMS Link)</label>
                                    <div className="flex">
                                        <span className="flex items-center justify-center px-4 bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg text-slate-400 font-medium">+27</span>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="82 123 4567" className="w-full h-11 px-4 rounded-r-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Valid From</label>
                                        <input type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} required className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Valid Until</label>
                                        <input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} required className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition-colors">
                                    <input type="checkbox" id="parking" checked={needsParking} onChange={e => setNeedsParking(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500/50 cursor-pointer" />
                                    <div className="flex-1">
                                        <label htmlFor="parking" className="font-semibold text-white cursor-pointer block">Requires Visitor Parking</label>
                                        <p className="text-xs text-slate-500">Alerts the guardhouse to assign a parking bay.</p>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none mt-4">
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        "Generate Dynamic Pass & Send Invite"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Bulk Invite Form */}
                    {inviteType === "bulk" && (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm text-center">

                            <div className="mb-8">
                                <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                                    <svg className="w-10 h-10 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Upload CSV File</h3>
                                <p className="text-sm text-slate-400">Perfect for events. Group Admins can invite up to 100 guests at once.</p>
                            </div>

                            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:bg-slate-800/50 hover:border-sky-500/50 transition-colors cursor-pointer group">
                                <p className="text-slate-300 font-medium group-hover:text-sky-400 transition-colors">Click to browse or drag and drop</p>
                                <p className="text-xs text-slate-500 mt-2">CSV must include FirstName, LastName, Phone, ValidFrom, ValidUntil</p>
                            </div>

                            <button className="mt-8 text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center justify-center gap-2 mx-auto">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download CSV Template
                            </button>

                        </div>
                    )}
                </div>

                {/* Right Column - Status/Preview */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm sticky top-28">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Pass Lifecycle
                            </h3>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                                <li className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-900 text-slate-500 group-[.is-active]:text-sky-500 group-[.is-active]:border-sky-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_5px_rgba(14,165,233,0.8)]"></div>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-700 bg-slate-800/80 shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-white text-sm">Created</div>
                                        </div>
                                        <div className="text-xs text-slate-400">Pass generated & pushed to local Impro server.</div>
                                    </div>
                                </li>
                                <li className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-700 bg-slate-800/30 opacity-60">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-white text-sm">Sent via SMS</div>
                                        </div>
                                    </div>
                                </li>
                                <li className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-700 bg-slate-800/30 opacity-60">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-white text-sm">Expired</div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
