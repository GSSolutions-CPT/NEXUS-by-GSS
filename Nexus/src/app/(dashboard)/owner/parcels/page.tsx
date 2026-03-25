"use client";

import { useState, useEffect } from "react";
import { Package, QrCode, CheckCircle2, Clock, Loader2, User, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/utils/supabase/client";

interface Parcel {
    id: string;
    courier_name: string;
    recipient_name: string | null;
    status: 'Pending Collection' | 'Collected';
    logged_at: string;
    collected_at: string | null;
    logged_by_name: string;
    collected_by_name: string | null;
}

export default function OwnerParcelsPage() {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

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

    useEffect(() => {
        fetchData();
        
        // Setup realtime subscription to refresh if a parcel is collected
        const supabase = createClient();
        const sub = supabase.channel('parcels_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, () => {
                fetchData();
            })
            .subscribe();
            
        return () => { supabase.removeChannel(sub); };
    }, []);

    const pendingParcels = parcels.filter(p => p.status === 'Pending Collection');
    const collectedParcels = parcels.filter(p => p.status === 'Collected').slice(0, 10);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8 text-sky-400" />
                        Deliveries & Parcels
                    </h1>
                    <p className="text-slate-400 mt-1">Track packages waiting for you at the security gate.</p>
                </div>
                <button
                    onClick={() => setShowQR(true)}
                    className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                    <QrCode className="w-5 h-5" />
                    My Collection QR
                </button>
            </div>

            {/* Ready for Collection */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Waiting for Collection ({pendingParcels.length})
                </h2>

                {pendingParcels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-slate-500 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">No pending deliveries</h3>
                        <p className="text-slate-500 max-w-sm">You don&apos;t have any packages waiting at the security gate right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingParcels.map(parcel => (
                            <div key={parcel.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col items-start shadow-sm hover:border-slate-700 transition-colors">
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                                <div className="flex items-center justify-between w-full mb-3">
                                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 uppercase tracking-wider">
                                        Ready for Pickup
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        {new Date(parcel.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{parcel.courier_name}</h3>
                                {parcel.recipient_name && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 w-full">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <span>For: {parcel.recipient_name}</span>
                                    </div>
                                )}
                                <div className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800/50 w-full flex items-center justify-between">
                                    <span>Logged by: {parcel.logged_by_name}</span>
                                    <span>{new Date(parcel.logged_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Collection History */}
            {collectedParcels.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-800">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Recent Collections
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {collectedParcels.map(parcel => (
                            <div key={parcel.id} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-300">{parcel.courier_name}</p>
                                        <p className="text-xs text-slate-500">Picked up {new Date(parcel.collected_at!).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-medium focus:outline-none flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code Modal Overlay */}
            {showQR && userId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/80">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-sky-400" /> My Collection QR
                            </h3>
                            <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center justify-center bg-slate-950">
                            <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-sky-500/20">
                                <QRCodeSVG
                                    value={userId}
                                    size={200}
                                    bgColor={"#ffffff"}
                                    fgColor={"#020617"} // slate-950
                                    level={"M"}
                                />
                            </div>
                            <p className="text-sky-400 font-medium mt-6 text-sm tracking-wide uppercase">Digital Signature</p>
                            <p className="text-slate-500 text-sm mt-2 text-center max-w-[250px] leading-relaxed">
                                Present this QR code to the security guard to verify your identity and collect your parcels.
                            </p>
                        </div>
                        
                        <div className="px-4 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-center">
                            <button 
                                onClick={() => setShowQR(false)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
