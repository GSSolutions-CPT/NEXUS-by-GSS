"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { X } from "lucide-react";

interface QRScannerProps {
    onResult: (decodedText: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onResult, onClose }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true
                },
                false
            );

            scannerRef.current.render(
                (decodedText) => {
                    // Success callback
                    if (scannerRef.current) {
                        scannerRef.current.clear();
                    }
                    onResult(decodedText);
                },
                () => {
                    // Ignore frame errors
                }
            );
        } catch (err) {
            console.error("Scanner init error:", err);
            setTimeout(() => {
                setError("Could not initialize camera. Please ensure permissions are granted.");
            }, 0);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onResult]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/80">
                    <h3 className="text-white font-medium">Scan Tenant QR</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 relative min-h-[300px] flex items-center justify-center">
                    {error ? (
                        <div className="text-rose-400 text-sm text-center p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
                            {error}
                        </div>
                    ) : (
                        <div id="qr-reader" className="w-full rounded-xl overflow-hidden shadow-inner bg-black" />
                    )}
                </div>
                
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50 text-center">
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        Position the tenant&apos;s collection QR code within the frame to digitally release the parcel.
                    </p>
                </div>
            </div>

            {/* Global style overrides for the injected html5-qrcode UI */}
            <style dangerouslySetInnerHTML={{__html: `
                #qr-reader {
                    border: none !important;
                }
                #qr-reader__scan_region {
                    background: #000;
                }
                #qr-reader__dashboard_section_csr span {
                    color: #94a3b8 !important;
                    font-family: inherit !important;
                }
                #qr-reader__dashboard_section_swaplink {
                    display: none !important;
                }
                #qr-reader button {
                    background: #0ea5e9 !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 8px !important;
                    font-weight: 500 !important;
                    margin-top: 10px !important;
                    cursor: pointer !important;
                }
                #qr-reader select {
                    background: #1e293b !important;
                    color: white !important;
                    border: 1px solid #334155 !important;
                    padding: 8px !important;
                    border-radius: 8px !important;
                    margin-bottom: 10px !important;
                    width: 100% !important;
                }
                #qr-reader a {
                    color: #0ea5e9 !important;
                }
            `}} />
        </div>
    );
}
