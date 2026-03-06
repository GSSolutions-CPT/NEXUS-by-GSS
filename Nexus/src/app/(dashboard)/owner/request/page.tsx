"use client";

import { useState } from "react";

export default function RequestCredentialPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
        }, 1200);
    };

    return (
        <div className="space-y-6 max-w-4xl">

            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Request Access Tags</h1>
                <p className="text-slate-400 mt-1">Order physical NFC tags or biometric enrollment for staff and long-term residents.</p>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">

                {success ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Your request for an access tag has been routed to the Estate Management office. You will be notified when it is ready for collection.
                        </p>
                        <button onClick={() => setSuccess(false)} className="mt-8 px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
                            Submit Another Request
                        </button>
                    </div>
                ) : (

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Person Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs text-center border border-sky-500/30">1</span>
                                Assignee Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">First Name</label>
                                    <input type="text" required placeholder="John" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Last Name</label>
                                    <input type="text" required placeholder="Doe" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Role / Title</label>
                                    <select required className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-sky-500 transition-colors">
                                        <option value="" disabled selected>Select Role</option>
                                        <option value="resident">Long-term Resident</option>
                                        <option value="domestic">Domestic Worker</option>
                                        <option value="contractor">Maintenance Contractor</option>
                                        <option value="employee">Business Employee</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Mobile Number</label>
                                    <input type="tel" required placeholder="082 123 4567" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Credential Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs text-center border border-sky-500/30">2</span>
                                Credential Type
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-start gap-4 p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 cursor-pointer hover:bg-sky-500/20 transition-colors">
                                    <input type="radio" name="credential" value="nfc" defaultChecked className="mt-1 flex-shrink-0 w-4 h-4 text-sky-500 focus:ring-sky-500 border-slate-600 bg-slate-800" />
                                    <div>
                                        <div className="font-semibold text-white">NFC Key Tag</div>
                                        <div className="text-xs text-slate-400 mt-1">Physical proxy tag for standard gate access. Can be attached to a keychain.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <input type="radio" name="credential" value="biometric" className="mt-1 flex-shrink-0 w-4 h-4 text-sky-500 focus:ring-sky-500 border-slate-600 bg-slate-800" />
                                    <div>
                                        <div className="font-semibold text-white">Biometric Scan</div>
                                        <div className="text-xs text-slate-400 mt-1">Requires assignee to visit the estate office for fingerprint/face enrollment.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Additional Notes (Optional)</label>
                                <textarea placeholder="e.g. Requires access to the service evaluator." className="w-full h-24 p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"></textarea>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                            <p className="text-xs text-slate-400 max-w-sm">Note: Ordering an NFC tag carries a replacement cost which will be billed to your unit&apos;s levy account.</p>
                            <button type="submit" disabled={loading} className="px-8 h-12 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none">
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    "Submit Request"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
