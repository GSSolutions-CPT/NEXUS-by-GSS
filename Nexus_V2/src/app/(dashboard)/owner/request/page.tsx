"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Smartphone, User, Briefcase, Phone, Mail, FileText, CheckCircle, UploadCloud, Download, Users } from "lucide-react";

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
    const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,FirstName,LastName,Role,Phone,Email,Notes\nJane,Doe,employee,0821234567,jane@test.com,Bulk onboarding";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Nexus_Employees_Template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const lines = text.split("\n").filter(l => l.trim() !== "");
            if (lines.length < 2) throw new Error("CSV file is empty or missing data.");

            const rows = lines.slice(1).map(line => {
                const parts = line.split(",");
                return {
                    firstName: parts[0]?.trim() || "",
                    lastName: parts[1]?.trim() || "",
                    role: parts[2]?.trim() || "employee",
                    phone: parts[3]?.trim() || "",
                    email: parts[4]?.trim() || "",
                    notes: parts[5]?.trim() || ""
                };
            }).filter(r => r.firstName && r.lastName && r.phone); // Require core fields

            if (rows.length === 0) throw new Error("No valid rows found in CSV. Ensure FirstName, LastName, and Phone are filled.");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in.");

            const { data: profile } = await supabase
                .from("profiles")
                .select("unit_id")
                .eq("id", user.id)
                .single();

            if (!profile?.unit_id) throw new Error("Your account is not linked to a unit.");

            const inserts = rows.map(r => ({
                unit_id: profile.unit_id,
                requested_by: user.id,
                assignee_first_name: r.firstName,
                assignee_last_name: r.lastName,
                assignee_role: r.role,
                assignee_phone: r.phone,
                assignee_email: r.email || null,
                credential_type: "stid_mobile",
                notes: r.notes || null,
                status: "Pending",
            }));

            // Supabase supports batch inserts automatically in .insert(array)
            const { error: insertErr } = await supabase.from("tag_requests").insert(inserts);

            if (insertErr) throw new Error(insertErr.message);

            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to parse or upload CSV.");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

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

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-700/50">
                    <button onClick={() => { setActiveTab("single"); setError(null); setSuccess(false); }}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "single" ? "text-sky-400 border-b-2 border-sky-400 bg-sky-500/5" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                        <User className="w-4 h-4" /> Single Request
                    </button>
                    <button onClick={() => { setActiveTab("bulk"); setError(null); setSuccess(false); }}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "bulk" ? "text-sky-400 border-b-2 border-sky-400 bg-sky-500/5" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                        <Users className="w-4 h-4" /> Bulk CSV Upload
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {success ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {activeTab === "single" ? "Request Submitted" : "Batch Upload Successful"}
                            </h2>
                            <p className="text-slate-400 max-w-md mx-auto">
                                {activeTab === "single" 
                                    ? `Your STID Mobile Credential request for ${firstName} ${lastName} has been sent to estate management. They will provision and send the credential to ${phone}.`
                                    : `All valid employee requests from your CSV have been successfully submitted for provisioning.`}
                            </p>
                            <button onClick={resetForm} className="mt-8 px-6 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
                                Submit Another Request
                            </button>
                        </div>
                    ) : activeTab === "bulk" ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold rounded-lg text-center">{error}</div>}
                            
                            <div className="text-center space-y-4">
                                <h3 className="text-xl font-bold text-white">Upload Employee CSV</h3>
                                <p className="text-sm text-slate-400 max-w-md mx-auto">
                                    Easily onboard multiple staff members at once by uploading a formatted spreadsheet.
                                </p>
                                <button onClick={downloadTemplate} type="button" className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors font-medium">
                                    <Download className="w-4 h-4" /> Download Empty CSV Template
                                </button>
                            </div>

                            <label className={`block border-2 border-dashed ${loading ? "border-slate-700/50 bg-slate-900/20" : "border-slate-600 hover:border-sky-500/50 hover:bg-slate-800/30"} rounded-xl p-12 text-center cursor-pointer transition-all group`}>
                                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} disabled={loading} className="sr-only" />
                                {loading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
                                        <p className="font-bold text-white">Processing Batch Upload...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-sky-400 transition-colors mb-4" />
                                        <p className="font-bold text-slate-300 group-hover:text-sky-400 transition-colors">Click to browse or drag inside</p>
                                        <p className="text-xs text-slate-500 mt-2">Only .csv files are supported</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold rounded-lg text-center">{error}</div>
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
        </div>
    );
}
