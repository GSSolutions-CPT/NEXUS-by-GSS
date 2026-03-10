"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RequestCredentialPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [phone, setPhone] = useState("");
    const [credentialType, setCredentialType] = useState("nfc");
    const [notes, setNotes] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to submit a request.");

            const { data: profile } = await supabase
                .from("profiles")
                .select("unit_id, first_name, last_name")
                .eq("id", user.id)
                .single();

            if (!profile?.unit_id) {
                throw new Error("Your account is not associated with a unit. Please contact support.");
            }

            const { error: insertErr } = await supabase
                .from("tag_requests")
                .insert([{
                    unit_id: profile.unit_id,
                    requested_by: user.id,
                    assignee_first_name: firstName,
                    assignee_last_name: lastName,
                    assignee_role: role,
                    assignee_phone: phone,
                    credential_type: credentialType,
                    notes: notes || null,
                    status: "Pending",
                }]);

            if (insertErr) {
                // Graceful fallback if the table doesn't exist yet
                if (insertErr.code === "42P01") {
                    throw new Error("The tag requests table has not been created yet. Please run the database migration.");
                }
                throw new Error("Failed to submit request. Please try again.");
            }

            setSuccess(true);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName(""); setLastName(""); setRole(""); setPhone("");
        setCredentialType("nfc"); setNotes(""); setError(null); setSuccess(false);
    };

    return (
        <div className="space-y-6 max-w-4xl">

            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Request Access Tags</h1>
                <p className="text-slate-400 mt-1">Order physical NFC tags or biometric enrollment for staff and long-term residents.</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">

                {success ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Your request for a <span className="font-semibold text-white">{credentialType === "nfc" ? "NFC Key Tag" : "Biometric Enrollment"}</span> for{" "}
                            <span className="font-semibold text-white">{firstName} {lastName}</span> has been sent to the estate management office. You will be notified when it is ready.
                        </p>
                        <button onClick={resetForm} className="mt-8 px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
                            Submit Another Request
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Assignee Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs text-center border border-sky-500/30">1</span>
                                Assignee Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">First Name</label>
                                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                                        placeholder="John" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Last Name</label>
                                    <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                                        placeholder="Doe" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Role / Title</label>
                                    <select required value={role} onChange={e => setRole(e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-sky-500 transition-colors">
                                        <option value="" disabled>Select Role</option>
                                        <option value="resident">Long-term Resident</option>
                                        <option value="domestic">Domestic Worker</option>
                                        <option value="contractor">Maintenance Contractor</option>
                                        <option value="employee">Business Employee</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Mobile Number</label>
                                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                                        placeholder="082 123 4567" className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Credential Type */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs text-center border border-sky-500/30">2</span>
                                Credential Type
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${credentialType === "nfc" ? "border-sky-500/30 bg-sky-500/10" : "border-slate-700/50 bg-slate-900/50 hover:bg-slate-800"}`}>
                                    <input type="radio" name="credential" value="nfc" checked={credentialType === "nfc"} onChange={() => setCredentialType("nfc")}
                                        className="mt-1 flex-shrink-0 w-4 h-4 text-sky-500 focus:ring-sky-500 border-slate-600 bg-slate-800" />
                                    <div>
                                        <div className="font-semibold text-white">NFC Key Tag</div>
                                        <div className="text-xs text-slate-400 mt-1">Physical proxy tag for standard gate access. Can be attached to a keychain.</div>
                                    </div>
                                </label>
                                <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${credentialType === "biometric" ? "border-sky-500/30 bg-sky-500/10" : "border-slate-700/50 bg-slate-900/50 hover:bg-slate-800"}`}>
                                    <input type="radio" name="credential" value="biometric" checked={credentialType === "biometric"} onChange={() => setCredentialType("biometric")}
                                        className="mt-1 flex-shrink-0 w-4 h-4 text-sky-500 focus:ring-sky-500 border-slate-600 bg-slate-800" />
                                    <div>
                                        <div className="font-semibold text-white">Biometric Scan</div>
                                        <div className="text-xs text-slate-400 mt-1">Requires assignee to visit the estate office for fingerprint/face enrollment.</div>
                                    </div>
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Additional Notes (Optional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="e.g. Requires access to the service elevator."
                                    className="w-full h-24 p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                            <p className="text-xs text-slate-400 max-w-sm">Note: Ordering an NFC tag carries a replacement cost which will be billed to your unit&apos;s levy account.</p>
                            <button type="submit" disabled={loading}
                                className="px-8 h-12 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none">
                                {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Submit Request"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
