"use client";

import { useState } from "react";
import { Plus, Trash2, Send, Share2, Copy, Check, MessageCircle, Mail, ArrowLeft, CalendarPlus, Clock } from "lucide-react";

interface AccessWindow {
    date: string;
    from: string;
    to: string;
}

interface InviteResult {
    visitorId: string;
    guestLink: string;
    pinCode: string;
    firstName: string;
    lastName: string;
}

export default function InviteVisitorPage() {
    const [inviteType, setInviteType] = useState("single");

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [needsParking, setNeedsParking] = useState(false);

    // Contractor / Guest Type
    const [visitorType, setVisitorType] = useState<"guest" | "contractor">("guest");
    const [contractorStartDate, setContractorStartDate] = useState("");
    const [contractorEndDate, setContractorEndDate] = useState("");

    // Access Windows — per-day time slots
    const [accessWindows, setAccessWindows] = useState<AccessWindow[]>([
        { date: "", from: "08:00", to: "17:00" }
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
    const [copied, setCopied] = useState(false);

    // ── Access Window Helpers ──
    const addWindow = () => {
        setAccessWindows(prev => [...prev, { date: "", from: "08:00", to: "17:00" }]);
    };

    const removeWindow = (index: number) => {
        setAccessWindows(prev => prev.filter((_, i) => i !== index));
    };

    const updateWindow = (index: number, field: keyof AccessWindow, value: string) => {
        setAccessWindows(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
    };

    // ── Submit ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInviteResult(null);

        // Validate access windows
        let validWindows: AccessWindow[] = [];

        if (visitorType === "contractor") {
            if (!contractorStartDate || !contractorEndDate) {
                setError("Please select a start and end date for the contractor.");
                setLoading(false); return;
            }
            const start = new Date(contractorStartDate);
            const end = new Date(contractorEndDate);
            if (end < start) {
                setError("End date cannot be before start date.");
                setLoading(false); return;
            }

            // Generate Mon-Fri 08:00-17:00
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const day = d.getDay();
                if (day !== 0 && day !== 6) { // 0=Sun, 6=Sat
                    validWindows.push({
                        date: d.toISOString().split("T")[0], // YYYY-MM-DD
                        from: "08:00",
                        to: "17:00"
                    });
                }
            }

            if (validWindows.length === 0) {
                setError("The selected date range contains no valid weekdays (Mon-Fri).");
                setLoading(false); return;
            }
        } else {
            validWindows = accessWindows.filter(w => w.date && w.from && w.to);
            if (validWindows.length === 0) {
                setError("Please add at least one access day with valid times.");
                setLoading(false);
                return;
            }
        }

        try {
            const res = await fetch("/api/visitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    needsParking,
                    accessWindows: validWindows,
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to invite visitor.");
            }

            const data = await res.json();

            // Build full guest link if the API returned a relative one
            const fullLink = data.guestLink?.startsWith("http")
                ? data.guestLink
                : `${window.location.origin}${data.guestLink}`;

            setInviteResult({
                visitorId: data.visitorId,
                guestLink: fullLink,
                pinCode: data.pinCode,
                firstName,
                lastName,
            });

            // Clear form
            setFirstName("");
            setLastName("");
            setPhone("");
            setNeedsParking(false);
            setAccessWindows([{ date: "", from: "08:00", to: "17:00" }]);
            setContractorStartDate("");
            setContractorEndDate("");
            setVisitorType("guest");

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // ── Share Helpers ──
    const shareMessage = (result: InviteResult) =>
        `Hi ${result.firstName}, you've been invited to visit! 🔐\n\nOpen your digital access pass:\n${result.guestLink}\n\nYour PIN: ${result.pinCode}\n\nPresent the QR code or PIN at the gate.\n\nSecured by Global Security Solutions\nhttps://www.globalsecuritysolutions.co.za`;

    const handleNativeShare = async (result: InviteResult) => {
        if (navigator.share) {
            await navigator.share({
                title: "Nexus Access Pass Invitation",
                text: shareMessage(result),
                url: result.guestLink,
            });
        }
    };

    const handleCopyLink = async (result: InviteResult) => {
        await navigator.clipboard.writeText(result.guestLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = (result: InviteResult) => {
        const encoded = encodeURIComponent(shareMessage(result));
        window.open(`https://wa.me/?text=${encoded}`, "_blank");
    };

    const handleEmail = (result: InviteResult) => {
        const subject = encodeURIComponent("Your Nexus Access Pass");
        const body = encodeURIComponent(shareMessage(result));
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    };

    // ── INVITE SUCCESS PANEL ──
    if (inviteResult) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Visitor Invited ✅</h1>
                        <p className="text-slate-400 mt-1">Share the access pass link with your guest.</p>
                    </div>
                </div>

                <div className="max-w-lg mx-auto space-y-6">
                    {/* Pass Summary Card */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Check className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{inviteResult.firstName} {inviteResult.lastName}</h2>
                                <p className="text-sm text-slate-400">PIN: <span className="font-mono font-bold text-sky-400 tracking-wider">{inviteResult.pinCode}</span></p>
                            </div>
                        </div>

                        {/* Guest Link */}
                        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
                            <input type="text" readOnly value={inviteResult.guestLink}
                                className="flex-1 bg-transparent text-sm text-slate-300 font-mono outline-none truncate" />
                            <button onClick={() => handleCopyLink(inviteResult)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-sky-400" />
                            Share Invite Link
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* WhatsApp */}
                            <button onClick={() => handleWhatsApp(inviteResult)}
                                className="flex items-center gap-3 px-4 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-xl transition-all font-medium text-sm">
                                <MessageCircle className="w-5 h-5" />
                                Send via WhatsApp
                            </button>

                            {/* Email */}
                            <button onClick={() => handleEmail(inviteResult)}
                                className="flex items-center gap-3 px-4 py-3.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 rounded-xl transition-all font-medium text-sm">
                                <Mail className="w-5 h-5" />
                                Send via Email
                            </button>

                            {/* Copy Link */}
                            <button onClick={() => handleCopyLink(inviteResult)}
                                className="flex items-center gap-3 px-4 py-3.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500/50 text-slate-300 rounded-xl transition-all font-medium text-sm">
                                <Copy className="w-5 h-5" />
                                Copy Link
                            </button>

                            {/* Native Share (mobile) */}
                            {typeof navigator !== "undefined" && "share" in navigator && (
                                <button onClick={() => handleNativeShare(inviteResult)}
                                    className="flex items-center gap-3 px-4 py-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-xl transition-all font-medium text-sm">
                                    <Share2 className="w-5 h-5" />
                                    More Options...
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Invite Another */}
                    <button onClick={() => setInviteResult(null)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700">
                        <ArrowLeft className="w-4 h-4" />
                        Invite Another Visitor
                    </button>
                </div>
            </div>
        );
    }

    // ── INVITE FORM ──
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Invite Visitors</h1>
                    <p className="text-slate-400 mt-1">Generate dynamic credentials for your guests to access the premises.</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column - Forms */}
                <div className="flex-1 space-y-6">

                    {/* Invite Type Switch */}
                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 w-full max-w-sm">
                        <button onClick={() => setInviteType("single")}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${inviteType === "single" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Single Guest
                        </button>
                        <button onClick={() => setInviteType("bulk")}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${inviteType === "bulk" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
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

                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">First Name</label>
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jan"
                                            className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Last Name</label>
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Van Der Merwe"
                                            className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Visitor Type */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Visitor Category</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${visitorType === "guest" ? "border-sky-500 bg-sky-500/10 text-white" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"}`}>
                                            <input type="radio" name="visitorType" value="guest" checked={visitorType === "guest"} onChange={() => setVisitorType("guest")} className="sr-only" />
                                            <span className="font-semibold text-sm">Standard Guest</span>
                                            <span className="text-[10px] text-center opacity-80">Flexible manual hours</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${visitorType === "contractor" ? "border-amber-500 bg-amber-500/10 text-white" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"}`}>
                                            <input type="radio" name="visitorType" value="contractor" checked={visitorType === "contractor"} onChange={() => setVisitorType("contractor")} className="sr-only" />
                                            <span className="font-semibold text-sm">Contractor</span>
                                            <span className="text-[10px] text-center opacity-80">Strict Mon-Fri, 8AM-5PM</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Mobile Number (For SMS Link)</label>
                                    <div className="flex">
                                        <span className="flex items-center justify-center px-4 bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg text-slate-400 font-medium">+27</span>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="82 123 4567"
                                            className="w-full h-11 px-4 rounded-r-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                    </div>
                                </div>

                                {/* ── Access Windows (Per-Day Time Slots or Contractor Auto) ── */}
                                {visitorType === "guest" ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold tracking-wide text-slate-400 uppercase flex items-center gap-2">
                                                <CalendarPlus className="w-3.5 h-3.5" />
                                                Access Schedule
                                            </label>
                                            <button type="button" onClick={addWindow}
                                                className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors">
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Day
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {accessWindows.map((window, index) => (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                                                    {/* Date */}
                                                    <div className="flex-1 min-w-0">
                                                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Date</label>
                                                        <input type="date" value={window.date}
                                                            onChange={e => updateWindow(index, "date", e.target.value)}
                                                            required
                                                            className="w-full h-9 px-2.5 rounded-lg bg-slate-950/50 border border-slate-700 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                                    </div>

                                                    {/* From Time */}
                                                    <div className="w-[100px] flex-shrink-0">
                                                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> From
                                                        </label>
                                                        <input type="time" value={window.from}
                                                            onChange={e => updateWindow(index, "from", e.target.value)}
                                                            required
                                                            className="w-full h-9 px-2.5 rounded-lg bg-slate-950/50 border border-slate-700 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                                    </div>

                                                    {/* To Time */}
                                                    <div className="w-[100px] flex-shrink-0">
                                                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> To
                                                        </label>
                                                        <input type="time" value={window.to}
                                                            onChange={e => updateWindow(index, "to", e.target.value)}
                                                            required
                                                            className="w-full h-9 px-2.5 rounded-lg bg-slate-950/50 border border-slate-700 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                                    </div>

                                                    {/* Remove */}
                                                    {accessWindows.length > 1 && (
                                                        <button type="button" onClick={() => removeWindow(index)}
                                                            className="mt-4 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-[11px] text-slate-500">
                                            Define which days and times the guest can enter the building. Each day can have different hours.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                        <label className="text-xs font-bold tracking-wide text-amber-500/80 uppercase flex items-center gap-2">
                                            <CalendarPlus className="w-3.5 h-3.5" />
                                            Contractor Project Duration
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Start Date</label>
                                                <input type="date" value={contractorStartDate} onChange={e => setContractorStartDate(e.target.value)} required
                                                    className="w-full h-10 px-3 rounded-lg bg-slate-950/50 border border-slate-700 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">End Date</label>
                                                <input type="date" value={contractorEndDate} onChange={e => setContractorEndDate(e.target.value)} required
                                                    className="w-full h-10 px-3 rounded-lg bg-slate-950/50 border border-slate-700 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500 transition-colors" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Access will be automatically granted only between <b>08:00 and 17:00</b> on **weekdays (Mon-Fri)** within this date range. Building security will deny access on weekends or after-hours.
                                        </p>
                                    </div>
                                )}

                                {/* Parking */}
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition-colors">
                                    <input type="checkbox" id="parking" checked={needsParking} onChange={e => setNeedsParking(e.target.checked)}
                                        className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500/50 cursor-pointer" />
                                    <div className="flex-1">
                                        <label htmlFor="parking" className="font-semibold text-white cursor-pointer block">Requires Visitor Parking</label>
                                        <p className="text-xs text-slate-500">Alerts the guardhouse to assign a parking bay.</p>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={loading}
                                    className="w-full h-12 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none mt-4">
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Generate Pass & Share Link
                                        </>
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

                {/* Right Column - Info */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm sticky top-28">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                How It Works
                            </h3>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-5 relative before:absolute before:left-[11px] before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-sky-500/50 before:via-slate-700 before:to-transparent">
                                {[
                                    { title: "Set Access Days", desc: "Choose which days and times the visitor can enter." },
                                    { title: "Share the Link", desc: "Send the guest pass via WhatsApp, email, or any app." },
                                    { title: "Guest Shows Pass", desc: "Visitor scans QR code or enters PIN at the gate." },
                                ].map((step, i) => (
                                    <li key={i} className="relative flex items-start gap-4 pl-8">
                                        <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full border border-sky-500/50 bg-slate-900 text-sky-400 text-xs font-bold shadow shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{step.title}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
