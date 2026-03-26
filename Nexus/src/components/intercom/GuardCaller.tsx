"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface TargetUser {
    id: string; // The profile ID
    unit_id: string;
    first_name: string;
    last_name: string;
    unit_name?: string;
}

export default function GuardCaller({ targetUser, onClose }: { targetUser: TargetUser, onClose: () => void }) {
    const [status, setStatus] = useState<"calling" | "ringing" | "connected" | "ended" | "failed">("calling");
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    
    const pcRef = useRef<RTCPeerConnection | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef = useRef<any>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const supabase = createClient();

    useEffect(() => {
        startCall();
        return () => {
            endCall();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startCall = async () => {
        try {
            // 1. Get local media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // 2. Setup Peer Connection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                // Incoming stream from tenant (usually just audio, but could be video)
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            };

            // 3. Setup Supabase Realtime Channel
            const channelName = `intercom_${targetUser.unit_id}`;
            const channel = supabase.channel(channelName, {
                config: { broadcast: { ack: true } }
            });
            channelRef.current = channel;

            // Listen for answers and ICE candidates from the tenant
            channel.on("broadcast", { event: "call_answer" }, async (payload) => {
                if (payload.payload.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
                    setStatus("connected");
                }
            });

            channel.on("broadcast", { event: "ice_candidate" }, async (payload) => {
                if (payload.payload.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
                }
            });

            channel.on("broadcast", { event: "call_rejected" }, () => {
                setStatus("failed");
                setTimeout(endCall, 2000);
            });

            channel.on("broadcast", { event: "call_ended" }, () => {
                setStatus("ended");
                setTimeout(onClose, 1000);
            });

            await channel.subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    // Create Offer
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    
                    // Send Offer to tenant
                    await channel.send({
                        type: "broadcast",
                        event: "call_offer",
                        payload: {
                            sdp: offer,
                            callerName: "Main Gate Guard",
                        }
                    });

                    setStatus("ringing"); // Assume ringing once offer is sent
                }
            });

            // Handle local ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({
                        type: "broadcast",
                        event: "ice_candidate",
                        payload: { candidate: event.candidate }
                    });
                }
            };

        } catch (err) {
            console.error("Failed to start call:", err);
            setStatus("failed");
        }
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

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        if (channelRef.current) {
            channelRef.current.send({
                type: "broadcast",
                event: "call_ended",
                payload: {}
            });
            channelRef.current.unsubscribe();
        }
        if (pcRef.current) pcRef.current.close();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
                    <div>
                        <h3 className="font-bold text-lg">Calling {targetUser.unit_name || "Unit"}</h3>
                        <p className="text-sm text-slate-400">{targetUser.first_name} {targetUser.last_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                        status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
                        status === 'ringing' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                        status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-sky-500/20 text-sky-400 animate-pulse'
                    }`}>
                        {status}
                    </span>
                </div>

                {/* Video Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transition-opacity duration-300 ${videoEnabled ? 'opacity-100' : 'opacity-0'}`} 
                    />
                    {!videoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <VideoOff className="w-12 h-12 text-slate-600" />
                        </div>
                    )}
                    {/* Remote audio playback */}
                    <audio ref={remoteAudioRef} autoPlay />
                </div>

                {/* Controls */}
                <div className="p-6 bg-slate-900 flex items-center justify-center gap-6">
                    <button 
                        onClick={toggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'}`}
                    >
                        {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>
                    
                    <button 
                        onClick={endCall}
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95"
                    >
                        <PhoneOff className="w-7 h-7" />
                    </button>

                    <button 
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'}`}
                    >
                        {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
