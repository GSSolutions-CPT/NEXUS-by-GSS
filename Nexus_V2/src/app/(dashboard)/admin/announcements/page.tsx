"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Megaphone, AlertTriangle, Info, Plus, ChevronDown, CheckCircle, BellRing } from "lucide-react";
import { announcementSchema } from "@/lib/validations";

type AnnouncementType = "info" | "warning" | "emergency";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: AnnouncementType;
    created_at: string;
    profiles?: { first_name: string; last_name: string; } | null;
}

export default function AdminAnnouncementsPage() {
    const supabase = useMemo(() => createClient(), []);
    
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<AnnouncementType>("info");
    
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from("announcements")
            .select("*, profiles(first_name, last_name)")
            .order("created_at", { ascending: false });
        
        if (data) setAnnouncements(data);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSubmitLoading(true);

        try {
            const parseResult = announcementSchema.safeParse({ title, content, type });
            if (!parseResult.success) {
                throw new Error(parseResult.error.issues[0]?.message || "Invalid input data");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            if (isEditing && editingAnnouncementId) {
                // Update existing
                const { error: updateErr } = await supabase
                    .from("announcements")
                    .update({
                        title: parseResult.data.title,
                        content: parseResult.data.content,
                        type: parseResult.data.type,
                    })
                    .eq("id", editingAnnouncementId);
                
                if (updateErr) throw new Error(updateErr.message);
                setSuccessMessage("Announcement updated successfully!");
            } else {
                // Insert new
                const { error: insertErr } = await supabase
                    .from("announcements")
                    .insert([{
                        title: parseResult.data.title,
                        content: parseResult.data.content,
                        type: parseResult.data.type,
                        author_id: user.id
                    }]);

                if (insertErr) throw new Error(insertErr.message);
                setSuccessMessage("Announcement posted successfully!");
            }

            setSuccess(true);
            resetForm();
            fetchAnnouncements();
            
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            const errorObj = err as Error;
            setError(errorObj.message || "Failed to save announcement");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string, annTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${annTitle}"? This cannot be undone.`)) return;
        
        setError(null);
        try {
            const { error: deleteErr } = await supabase
                .from("announcements")
                .delete()
                .eq("id", id);
            
            if (deleteErr) throw new Error(deleteErr.message);
            
            setSuccessMessage("Announcement deleted.");
            setSuccess(true);
            fetchAnnouncements();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            const errorObj = err as Error;
            setError(errorObj.message || "Failed to delete announcement");
        }
    };

    const openEdit = (ann: Announcement) => {
        setEditingAnnouncementId(ann.id);
        setTitle(ann.title);
        setContent(ann.content);
        setType(ann.type);
        setIsEditing(true);
        setIsCreating(true);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setIsCreating(false);
        setIsEditing(false);
        setEditingAnnouncementId(null);
        setTitle("");
        setContent("");
        setType("info");
        setError(null);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case "emergency": return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            case "warning": return <Megaphone className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-sky-500" />;
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case "emergency": return "bg-rose-500/10 text-rose-400 border-rose-500/30";
            case "warning": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
            default: return "bg-sky-500/10 text-sky-400 border-sky-500/30";
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-sky-400" />
                        Announcements
                    </h1>
                    <p className="text-slate-400 mt-1">Broadcast important notices to all estate tenants.</p>
                </div>
                
                <button 
                    onClick={() => { resetForm(); setIsCreating(true); }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Create Notice
                </button>
            </div>

            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl animate-in zoom-in-95 duration-200">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            {isCreating && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {isEditing ? <BellRing className="w-5 h-5 text-amber-400" /> : <BellRing className="w-5 h-5 text-sky-400" />} 
                            {isEditing ? "Edit Broadcast Notice" : "New Broadcast"}
                        </h2>
                        <button onClick={resetForm} className="text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold rounded-lg">{error}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label htmlFor="announcement-title" className="text-xs font-bold tracking-wide text-slate-400 uppercase">Title / Subject</label>
                                <input id="announcement-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Water Outage Maintenance"
                                    className="w-full h-11 px-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label htmlFor="priority-type" className="text-xs font-bold tracking-wide text-slate-400 uppercase">Priority Type</label>
                                <div className="relative">
                                    <select id="priority-type" value={type} onChange={e => setType(e.target.value as AnnouncementType)} required
                                        className="w-full h-11 pl-4 pr-10 rounded-lg bg-slate-900/50 border border-slate-700 text-white appearance-none focus:outline-none focus:border-sky-500 transition-colors">
                                        <option value="info">General Info</option>
                                        <option value="warning">Warning / Warning Notice</option>
                                        <option value="emergency">🚨 EMERGENCY BLAST</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="message-content" className="text-xs font-bold tracking-wide text-slate-400 uppercase">Message Content</label>
                            <textarea id="message-content" value={content} onChange={e => setContent(e.target.value)} required placeholder="Provide full details of the announcement here..."
                                className="w-full h-32 p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none" />
                        </div>
                        
                        {type === "emergency" && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex gap-4 animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-rose-400">Emergency Override Selected</p>
                                    <p className="text-xs text-rose-500/80 mt-1">This will prominently flag all tenant dashboards immediately. Use only for fires, severe breaches, or immediate crises.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex gap-4">
                            <button type="submit" disabled={submitLoading}
                                className={`h-11 px-8 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                    type === "emergency" ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]" 
                                    : "bg-sky-500 hover:bg-sky-600 text-white"
                                } disabled:opacity-50 disabled:pointer-events-none`}
                            >
                                {submitLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditing ? <CheckCircle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />)}
                                {isEditing ? "Save Changes" : (type === "emergency" ? "SEND EMERGENCY BLAST" : "Post Announcement")}
                            </button>
                            <button type="button" onClick={resetForm} className="h-11 px-6 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-all">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Past Announcements</h3>
                
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />)}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/20 border border-slate-800 rounded-xl">
                        <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No announcements have been posted yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {announcements.map((ann) => (
                            <div key={ann.id} className={`p-5 rounded-xl border flex gap-4 transition-all group ${
                                ann.type === 'emergency' ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                            }`}>
                                <div className="mt-1 flex-shrink-0">
                                    {getIconForType(ann.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 truncate">
                                            <h4 className={`text-lg font-bold truncate ${ann.type === 'emergency' ? 'text-rose-400' : 'text-white'}`}>
                                                {ann.title}
                                            </h4>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeColor(ann.type)}`}>
                                                {ann.type}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(ann)} title="Edit Notice"
                                                className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(ann.id, ann.title)} title="Delete Notice"
                                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-3">
                                        {ann.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                        <span>Posted {new Date(ann.created_at).toLocaleDateString()} at {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
                                        <span className="hidden sm:block">By {ann.profiles?.first_name} {ann.profiles?.last_name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
