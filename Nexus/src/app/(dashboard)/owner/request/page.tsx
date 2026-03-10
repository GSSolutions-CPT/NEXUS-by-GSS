"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Smartphone, User, Briefcase, Phone, Mail, FileText, CheckCircle } from "lucide-react";

export default function RequestCredentialPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
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
                .select("unit_id")
                .eq("id", user.id)
                .single();

            if (!profile?.unit_id) {
                throw new Error("Your account is not linked to a unit. Contact support.");
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
                    assignee_email: email || null,
                    credential_type: "stid_mobile",
                    notes: notes || null,
                    status: "Pending",
                }]);

            if (insertErr) {
                if (insertErr.code === "42P01") throw new Error("Database not ready — contact support.");
                throw new Error("Submission failed. Please try again.");
            }

            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName(""); setLastName(""); setRole(""); setPhone("");
        setEmail(""); setNotes(""); setError(null); setSuccess(false);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Request STID Mobile Credential</h1>
                <p className="text-slate-400 mt-1">
                    Request a digital mobile credential for a staff member or long-term resident. The credential will be provisioned to their smartphone for gate access.
                </p>
            </div>

            {/* Info Card */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-sky-300">What is a STID Mobile Credential?</p>
                    <p className="text-sm text-slate-400 mt-1">
                        A secure digital access credential stored on a smartphone. The assignee will receive an invitation via the STID app to accept and activate their credential. Works with all Impro access control readers on the estate.
                    </p>
                </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                {success ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Your STID Mobile Credential request for{" "}
                            <span className="font-semibold text-white">{firstName} {lastName}</span> has been sent to estate management. They will provision and send the credential to {phone}.
                        </p>
                        <button onClick={resetForm} className="mt-8 px-6 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
                            Submit Another Request
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg">{error}</div>
                        )}

                        {/* Assignee Details */}
                        <div className="space-y-5">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <User className="w-4 h-4 text-sky-400" />
                                Assignee Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">First Name</label>
                                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                                        placeholder="John"
                                        className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Last Name</label>
                                    <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold tracking-wide text-slate-400 uppercase flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" /> Role
                                </label>
                                <select required value={role} onChange={e => setRole(e.target.value)}
                                    className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-sky-500 transition-colors">
                                    <option value="" disabled>Select a role</option>
                                    <option value="resident">Long-term Resident</option>
                                    <option value="domestic">Domestic Worker</option>
                                    <option value="contractor">Maintenance Contractor</option>
                                    <option value="employee">Business Employee</option>
                                    <option value="security">Security Staff</option>
                                </select>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-5">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                                <Smartphone className="w-4 h-4 text-sky-400" />
                                Mobile Credential Delivery
                            </h3>
                            <p className="text-sm text-slate-400 -mt-3">The STID credential invitation will be sent to the assignee&apos;s mobile number and/or email address.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" /> Mobile Number <span className="text-rose-400">*</span>
                                    </label>
                                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                                        placeholder="082 123 4567"
                                        className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-slate-400 uppercase flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-slate-600">(optional)</span>
                                    </label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-wide text-slate-400 uppercase flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Additional Notes <span className="text-slate-600">(optional)</span>
                            </label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. Access required from Monday–Friday 06:00–18:00 only."
                                className="w-full h-24 p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none" />
                        </div>

                        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-end">
                            <button type="submit" disabled={loading}
                                className="px-8 h-12 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none">
                                {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (
                                    <><Smartphone className="w-4 h-4" /> Request Mobile Credential</>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
