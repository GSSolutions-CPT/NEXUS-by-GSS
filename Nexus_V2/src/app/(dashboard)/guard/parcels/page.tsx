"use client";

import { useState, useEffect } from "react";
import { Package, Plus, QrCode, CheckCircle2, Loader2, User, Clock } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import { createClient } from "@/utils/supabase/client";

interface Unit {
    id: string;
    name: string;
}

interface Parcel {
    id: string;
    unit_id: string;
    unit_name: string;
    courier_name: string;
    recipient_name: string | null;
    status: 'Pending Collection' | 'Collected';
    logged_at: string;
    collected_at: string | null;
    logged_by_name: string;
    collected_by_name: string | null;
}

export default function GuardParcelsPage() {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Logging Form State
    const [showForm, setShowForm] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [courierName, setCourierName] = useState("");
    const [recipientName, setRecipientName] = useState("");

    // Scanner State
    const [scanningParcelId, setScanningParcelId] = useState<string | null>(null);
    const [isProcessingQR, setIsProcessingQR] = useState(false);

    const fetchParcels = async () => {
        try {
            const res = await fetch("/api/parcels");
            const data = await res.json();
            if (data.parcels) {
                setParcels(data.parcels);
            }
        } catch (error) {
            console.error("Failed to fetch parcels:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnits = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase.from('units').select('id, name').order('name');
            if (data) setUnits(data);
        } catch (error) {
            console.error("Failed to fetch units:", error);
        }
    };

    useEffect(() => {
        fetchParcels();
        fetchUnits();
    }, []);

    const handleLogParcel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit || !courierName) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/parcels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unit_id: selectedUnit,
                    courier_name: courierName,
                    recipient_name: recipientName
                })
            });

            if (!res.ok) throw new Error("Failed to log parcel");

            // Reset form
            setSelectedUnit("");
            setCourierName("");
            setRecipientName("");
            setShowForm(false);
            
            // Refresh list
            fetchParcels();

        } catch (error) {
            console.error(error);
            alert("Failed to log parcel. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQRResult = async (decodedText: string) => {
        if (!scanningParcelId || isProcessingQR) return;
        setIsProcessingQR(true);
        
        try {
            const res = await fetch(`/api/parcels/${scanningParcelId}/collect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collection_signature_uid: decodedText
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to release parcel.");
            }

            // Success
            setScanningParcelId(null);
            alert("Parcel successfully released to tenant!");
            fetchParcels();
            
        } catch (error) {
            const err = error as Error;
            console.error(err);
            alert(`QR Validation Failed: ${err.message}`);
        } finally {
            setIsProcessingQR(false);
        }
    };

    const pendingParcels = parcels.filter(p => p.status === 'Pending Collection');
    const collectedParcels = parcels.filter(p => p.status === 'Collected').slice(0, 10); // Show last 10

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8 text-sky-400" />
                        Gate Deliveries
                    </h1>
                    <p className="text-slate-400 mt-1">Log incoming parcels and manage secure collections.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Log Incoming Parcel
                    </button>
                )}
            </div>

            {/* Logging Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-semibold text-white mb-5">Log Delivery</h2>
                    <form onSubmit={handleLogParcel} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Destination Unit</label>
                                <select
                                    required
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                >
                                    <option value="" disabled>Select Unit...</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Courier / Service</label>
                                <input
                                    required
                                    type="text"
                                    value={courierName}
                                    onChange={(e) => setCourierName(e.target.value)}
                                    placeholder="e.g. FedEx, UberEats, Amazon..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Recipient Name (Optional)</label>
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="Name printed on the package if available"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/50">
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
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50 transition-colors shadow-lg shadow-sky-500/20"
                            >
                                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin"/> Logging...</> : "Record Delivery"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Waiting for Collection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Pending Collection ({pendingParcels.length})
                    </h2>
                </div>

                {pendingParcels.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                        <Package className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-300">No pending parcels</h3>
                        <p className="text-slate-500 text-sm mt-1">All delivered items have been collected.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingParcels.map(parcel => (
                            <div key={parcel.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors"></div>
                                
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-sm font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md">
                                        Unit {parcel.unit_name}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        {new Date(parcel.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-white mb-2">{parcel.courier_name}</h3>
                                
                                <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
                                    <User className="w-4 h-4" />
                                    <span>{parcel.recipient_name || 'Name not provided'}</span>
                                </div>

                                <button
                                    onClick={() => setScanningParcelId(parcel.id)}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-slate-700 hover:border-sky-500/50"
                                >
                                    <QrCode className="w-5 h-5 text-sky-400" />
                                    Scan QR to Release
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Collected History (Snippet) */}
            <div className="space-y-4 pt-8 border-t border-slate-800">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Recently Collected
                </h2>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-sm">
                    {collectedParcels.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">No collection history available.</div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {collectedParcels.map(parcel => (
                                <div key={parcel.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <Package className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Unit {parcel.unit_name} - {parcel.courier_name}</p>
                                            <p className="text-xs text-slate-500">Handed over by {parcel.logged_by_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-emerald-400 flex items-center gap-1.5 justify-end">
                                            <CheckCircle2 className="w-4 h-4" /> Collected
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {parcel.collected_at ? new Date(parcel.collected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Scanner Modal Overlay */}
            {scanningParcelId && (
                <QRScanner 
                    onResult={handleQRResult}
                    onClose={() => setScanningParcelId(null)}
                />
            )}
            
            {/* Processing QR Overlay */}
            {isProcessingQR && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center shadow-2xl">
                        <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
                        <h3 className="text-white font-medium text-lg">Verifying Signature...</h3>
                        <p className="text-slate-400 text-sm mt-1">Cross-referencing tenant profile.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
