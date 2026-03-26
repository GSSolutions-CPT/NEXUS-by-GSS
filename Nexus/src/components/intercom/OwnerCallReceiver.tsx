"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Phone, PhoneOff, Mic, MicOff, DoorOpen } from "lucide-react";

export default function OwnerCallReceiver() {
    const supabase = createClient();
    
    const [unitId, setUnitId] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ callerName: string; sdp: RTCSessionDescriptionInit } | null>(null);
    const [status, setStatus] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
    const [micEnabled, setMicEnabled] = useState(true);
    const [openingGate, setOpeningGate] = useState(false);
    const [gateStatus, setGateStatus] = useState<"idle" | "success" | "error">("idle");

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef = useRef<any>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    // 1. Fetch Profile Unit ID
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("profiles").select("unit_id").eq("id", user.id).single();
            if (profile?.unit_id) {
                setUnitId(profile.unit_id);
            }
        };
        init();

        // Create ringtone audio element
        ringtoneRef.current = new Audio("https://cdn.freesound.org/previews/415/415510_7965934-lq.mp3");
        ringtoneRef.current.loop = true;

        return () => resetCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Subscribe to Supabase Channel
    useEffect(() => {
        if (!unitId) return;

        const channelName = `intercom_${unitId}`;
        const channel = supabase.channel(channelName, {
            config: { broadcast: { ack: true } }
        });
        channelRef.current = channel;

        channel.on("broadcast", { event: "call_offer" }, (payload) => {
            if (status !== "idle") {
                // Already in a call, reject automatically
                channel.send({ type: "broadcast", event: "call_rejected", payload: {} });
                return;
            }
            setIncomingCall(payload.payload);
            setStatus("ringing");
            ringtoneRef.current?.play().catch(e => console.warn("Autoplay blocked for ringtone", e));
        });

        channel.on("broadcast", { event: "ice_candidate" }, async (payload) => {
            if (pcRef.current && payload.payload.candidate) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
            }
        });

        channel.on("broadcast", { event: "call_ended" }, () => {
            endCallLocally();
        });

        channel.subscribe();

        return () => {
            channel.unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unitId, status]);

    const acceptCall = async () => {
        if (!incomingCall || !channelRef.current) return;
        ringtoneRef.current?.pause();
        setStatus("connected");

        try {
            // Get local audio (Tenants probably don't want to broadcast video to guards blindly)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                // Incoming stream from Guard (Audio + Video)
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "ice_candidate",
                        payload: { candidate: event.candidate }
                    });
                }
            };

            // Set remote Offer
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));

            // Create and send Answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await channelRef.current.send({
                type: "broadcast",
                event: "call_answer",
                payload: { sdp: answer }
            });

        } catch (err) {
            console.error("Failed to accept call:", err);
            rejectCall();
        }
    };

    const rejectCall = () => {
        if (channelRef.current) {
            channelRef.current.send({ type: "broadcast", event: "call_rejected", payload: {} });
        }
        endCallLocally();
    };

    const hangUp = () => {
        if (channelRef.current) {
            channelRef.current.send({ type: "broadcast", event: "call_ended", payload: {} });
        }
        endCallLocally();
    };

    const endCallLocally = () => {
        ringtoneRef.current?.pause();
        if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        
        if (pcRef.current) pcRef.current.close();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        
        setStatus("ended");
        setTimeout(resetCall, 1500);
    };

    const resetCall = () => {
        setIncomingCall(null);
        setStatus("idle");
        setGateStatus("idle");
        pcRef.current = null;
        localStreamRef.current = null;
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicEnabled(audioTrack.enabled);
            }
        }
    };

    const handleOpenDoor = async () => {
        setOpeningGate(true);
        setGateStatus("idle");
        try {
            const res = await fetch("/api/opendoor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ door: 1, action: "pulse" }),
            });
            if (!res.ok) throw new Error("Failed to open gate");
            setGateStatus("success");
            setTimeout(() => setGateStatus("idle"), 4000);
        } catch {
            setGateStatus("error");
            setTimeout(() => setGateStatus("idle"), 4000);
        } finally {
            setOpeningGate(false);
        }
    };

    // Render nothing if idle
    if (status === "idle") return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-200">
                
                {status === "ringing" && (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-sky-500/20 flex items-center justify-center animate-pulse border-4 border-sky-500/30">
                            <Phone className="w-10 h-10 text-sky-400 animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Incoming Call</h3>
                            <p className="text-slate-400">{incomingCall?.callerName || "Main Gate Station"}</p>
                            <p className="text-sm text-sky-400 font-medium mt-1">Requesting Access Verification</p>
                        </div>
                        <div className="flex gap-4 w-full pt-4">
                            <button onClick={rejectCall} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors">
                                Decline
                            </button>
                            <button onClick={acceptCall} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95">
                                Accept
                            </button>
                        </div>
                    </div>
                )}

                {status === "connected" && (
                    <>
                        <div className="p-4 bg-slate-950 flex justify-between items-center text-white border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="font-semibold">{incomingCall?.callerName || "Gate Call"}</span>
                            </div>
                            <span className="text-xs font-mono text-emerald-400">00:00</span>
                        </div>
                        
                        <div className="relative aspect-[3/4] sm:aspect-square bg-black overflow-hidden flex flex-col">
                            {/* Guard's Video Feed */}
                            <video 
                                ref={remoteVideoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover" 
                            />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-wrap items-center justify-center gap-4">
                                
                                <button 
                                    onClick={toggleMic}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${micEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-rose-500/80 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`}
                                >
                                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </button>
                                
                                <button 
                                    onClick={handleOpenDoor}
                                    disabled={openingGate}
                                    className={`h-12 px-6 rounded-full flex items-center justify-center gap-2 font-bold transition-all ${
                                        gateStatus === 'success' ? 'bg-emerald-500 text-white' :
                                        gateStatus === 'error' ? 'bg-rose-500 text-white' :
                                        'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.5)]'
                                    } disabled:opacity-50 active:scale-95`}
                                >
                                    {openingGate ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : gateStatus === 'success' ? (
                                        "Opened!"
                                    ) : (
                                        <><DoorOpen className="w-5 h-5" /> OPEN GATE</>
                                    )}
                                </button>

                                <button 
                                    onClick={hangUp}
                                    className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                                
                            </div>
                        </div>
                    </>
                )}

                {status === "ended" && (
                    <div className="p-8 text-center text-slate-400 animate-in fade-in duration-300">
                        Call Ended.
                    </div>
                )}
            </div>
        </div>
    );
}
