"use client";

import { useState, useEffect } from "react";
import { Wrench, Clock, CheckCircle2, AlertCircle, Loader2, ImageIcon } from "lucide-react";

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    image_url: string | null;
    created_at: string;
    unit_name?: string;
    reported_by_name?: string;
}

const COLUMNS = [
    { id: 'Open', title: 'Open Issues', icon: AlertCircle, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'Resolved', title: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
] as const;

export default function AdminMaintenancePage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const updateTicketStatus = async (ticketId: string, newStatus: string) => {
        // Optimistic update
        const originalTickets = [...tickets];
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus as Ticket['status'] } : t));

        try {
            const res = await fetch(`/api/maintenance/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Update failed");
        } catch (error) {
            console.error(error);
            // Revert on error
            setTickets(originalTickets);
            alert("Failed to update status.");
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        // Helps with drag visual
        setTimeout(() => {
            const el = document.getElementById(`ticket-${id}`);
            if (el) el.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent, id: string) => {
        const el = document.getElementById(`ticket-${id}`);
        if (el) el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) {
            const ticket = tickets.find(t => t.id === id);
            if (ticket && ticket.status !== status) {
                updateTicketStatus(id, status);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Wrench className="w-8 h-8 text-sky-400" />
                    Maintenance Board
                </h1>
                <p className="text-slate-400 mt-1">Track and manage snag reports and maintenance issues across all units.</p>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-[500px]">
                {COLUMNS.map(column => {
                    const columnTickets = tickets.filter(t => t.status === column.id);
                    const Icon = column.icon;
                    
                    return (
                        <div 
                            key={column.id}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${column.bg} ${column.border} border`}>
                                        <Icon className={`w-4 h-4 ${column.color}`} />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white">{column.title}</h2>
                                </div>
                                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md">
                                    {columnTickets.length}
                                </span>
                            </div>

                            {/* Column Body (Scrollable) */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
                                {columnTickets.length === 0 ? (
                                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-800/80 rounded-xl">
                                        <p className="text-sm text-slate-500 font-medium">Drop tickets here</p>
                                    </div>
                                ) : (
                                    columnTickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            id={`ticket-${ticket.id}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, ticket.id)}
                                            onDragEnd={(e) => handleDragEnd(e, ticket.id)}
                                            className={`bg-slate-800 border ${ticket.priority === 'Urgent' ? 'border-rose-500/30' : 'border-slate-700'} rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-colors shadow-sm relative group`}
                                        >
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                                                    ticket.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400' :
                                                    ticket.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                    ticket.priority === 'Low' ? 'bg-slate-700 text-slate-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {ticket.priority}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-white font-medium mb-1.5 leading-snug">{ticket.title}</h3>
                                            
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 truncate">
                                                <span className="font-medium text-slate-300 truncate max-w-[120px]">{ticket.unit_name}</span>
                                                <span className="text-slate-600">•</span>
                                                <span className="truncate">{ticket.reported_by_name}</span>
                                            </div>

                                            {ticket.image_url && (
                                                <a 
                                                    href={ticket.image_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-md bg-slate-700/50 hover:bg-sky-500/20 flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors"
                                                    title="View Attachment"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                </a>
                                            )}

                                            <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                                                {ticket.description}
                                            </div>
                                            
                                            {/* Mobile Move Buttons (only visible on small screens since drag-drop is hard on touch) */}
                                            <div className="md:hidden pt-3 mt-3 border-t border-slate-700 flex gap-2">
                                                {COLUMNS.filter(c => c.id !== ticket.status).map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => updateTicketStatus(ticket.id, c.id)}
                                                        className="flex-1 py-1.5 text-xs bg-slate-900 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                                                    >
                                                        Move to {c.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Global Scoped Scrollbar Style for the Kanban columns */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(51, 65, 85, 0.5);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
}
