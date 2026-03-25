"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import Image from "next/image";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(() => {
        if (typeof window === "undefined") return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BeforeInstallPromptEvent has no standard TS type
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    useEffect(() => {
        // If running as installed app, clear the dismissed flag so if they uninstall,
        // the prompt will appear again next time they visit the browser version.
        if (isStandalone) {
            localStorage.removeItem("installPromptDismissed");
            return; // Don't show prompt inside the installed app
        }

        // Check if user previously dismissed the prompt
        const dismissedAt = localStorage.getItem("installPromptDismissed");
        if (dismissedAt) {
            // Re-show the prompt after 7 days
            const dismissedTime = parseInt(dismissedAt, 10);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDays) {
                return;
            }
            // Expired — remove and re-show
            localStorage.removeItem("installPromptDismissed");
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // iOS doesn't support beforeinstallprompt, show custom prompt after a short delay
            const timer = setTimeout(() => setShowPrompt(true), 2000);
            return () => clearTimeout(timer);
        }

        // Android / Chrome desktop support
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Small delay to not interrupt the user immediately
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
            // Clear dismissed flag since they installed
            localStorage.removeItem("installPromptDismissed");
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Store timestamp so we can re-show after 7 days
        localStorage.setItem("installPromptDismissed", Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-300">
            <div className="p-3 md:p-4 bg-gradient-to-t from-slate-900 via-slate-800/98 to-slate-800/95 backdrop-blur-xl border-t border-sky-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
                <div className="max-w-md mx-auto relative flex items-start gap-3 md:gap-4">
                    <button
                        onClick={handleDismiss}
                        className="absolute -top-1 -right-1 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <div className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center p-2 mt-0.5 shadow-lg shadow-sky-500/20">
                        <Image src="/logo-192.svg" alt="Nexus" width={48} height={48} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 pr-6">
                        <h3 className="text-white font-semibold text-sm md:text-base mb-0.5">Get Nexus App</h3>

                        {isIOS ? (
                            <div className="text-slate-300 text-xs md:text-sm leading-snug">
                                Tap{" "}
                                <span className="inline-flex items-center align-middle mx-0.5 px-1 py-0.5 bg-slate-700 rounded">
                                    <Share className="w-3 h-3 text-sky-400" />
                                </span>{" "}
                                then{" "}
                                <strong className="text-white whitespace-nowrap">
                                    <PlusSquare className="w-3 h-3 inline mr-0.5" />Add to Home Screen
                                </strong>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-slate-300 text-xs md:text-sm leading-snug">
                                    Faster access, works offline, feels native.
                                </p>
                                <button
                                    onClick={handleInstallClick}
                                    className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all w-full text-sm shadow-lg shadow-sky-500/20 active:scale-[0.97]"
                                >
                                    <Download className="w-4 h-4" />
                                    Install App
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
