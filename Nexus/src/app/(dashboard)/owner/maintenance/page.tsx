"use client";

import { useState, useEffect, useRef } from "react";
import { Wrench, CheckCircle2, Clock, AlertCircle, Plus, ImageIcon, X, Loader2, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    image_url: string | null;
    created_at: string;
}

export default function OwnerMaintenancePage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [priority, setPriority] = useState("Medium");
    
    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/maintenance");
            const data = await res.json();
            if (data.tickets) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image must be smaller than 5MB");
                return;
            }
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = null;

            // 1. Upload image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('maintenance_images')
                    .upload(filePath, imageFile, { upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('maintenance_images')
                    .getPublicUrl(filePath);
                
                uploadedImageUrl = publicUrlData.publicUrl;
            }

            // 2. Submit ticket
            const res = await fetch("/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    priority,
                    image_url: uploadedImageUrl
                })
            });

            if (!res.ok) throw new Error("Failed to create ticket");

            // Reset form
            setTitle("");
            setDescription("");
            setCategory("General");
            setPriority("Medium");
            removeImage();
            setShowForm(false);
            
            // Refresh list
            fetchTickets();

        } catch (error) {
            console.error("Error submitting ticket:", error);
            alert("Failed to submit ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'Resolved': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
            case 'In Progress': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
            default: return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" /> Open</span>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Wrench className="w-8 h-8 text-sky-400" />
                        Maintenance & Snags
                    </h1>
                    <p className="text-slate-400 mt-1">Report issues in your unit and track their resolution status.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Report Issue
                    </button>
                )}
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="p-5 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                        <h2 className="text-xl font-semibold text-white">New Maintenance Request</h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Issue Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Broken light fixture in living room"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none"
                                >
                                    <option value="General">General Maintenance</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="HVAC">Air Conditioning / HVAC</option>
                                    <option value="Appliance">Appliance</option>
                                    <option value="Structural">Structural / Damage</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none"
                                >
                                    <option value="Low">Low (No rush)</option>
                                    <option value="Medium">Medium (Standard)</option>
                                    <option value="High">High (Needs attention soon)</option>
                                    <option value="Urgent">Urgent (Emergency)</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Description / Access Details</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe the issue in detail. If repairs require entry, please mention your preferred times or if we have permission to enter."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors resize-y"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Photo Attachment (Optional)</label>
                                
                                {!imagePreview ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 bg-slate-950/50 hover:bg-sky-500/5 rounded-xl p-8 text-center cursor-pointer transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-sky-500/20 flex items-center justify-center mx-auto mb-3 transition-colors">
                                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-400 transition-colors" />
                                        </div>
                                        <p className="text-slate-300 font-medium">Click to upload a photo</p>
                                        <p className="text-slate-500 text-sm mt-1">PNG, JPG or GIF (max. 5MB)</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 inline-block group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imagePreview} alt="Preview" className="h-48 w-auto object-cover max-w-full" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button 
                                                type="button" 
                                                onClick={removeImage}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" /> Remove Photo
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-500/20"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send className="w-5 h-5" /> Submit Request</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tickets List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Your Requests</h2>
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800/50 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-4" />
                        <p className="text-slate-400">Loading your tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                            <Wrench className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">No maintenance requests</h3>
                        <p className="text-slate-500 max-w-sm">You haven&apos;t submitted any maintenance or snag reports yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors flex flex-col h-full group">
                                <div className="flex items-start justify-between mb-3 gap-4">
                                    <StatusBadge status={ticket.status} />
                                    <span className="text-xs font-medium text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-white mb-2 leading-tight group-hover:text-sky-400 transition-colors">
                                    {ticket.title}
                                </h3>
                                
                                <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
                                    {ticket.description}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                    <div className="flex gap-2">
                                        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                                            {ticket.category}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                                            ticket.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400' :
                                            ticket.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
                                            ticket.priority === 'Low' ? 'bg-slate-800 text-slate-400' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    
                                    {ticket.image_url && (
                                        <a 
                                            href={ticket.image_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1.5"
                                        >
                                            <ImageIcon className="w-4 h-4" /> View Photo
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
