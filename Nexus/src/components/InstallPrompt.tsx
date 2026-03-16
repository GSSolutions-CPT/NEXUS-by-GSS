"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import Image from "next/image";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BeforeInstallPromptEvent has no standard TS type
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
    useEffect(() => {
        // Check if the app is already installed
        const isAppInstalled = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
        setIsStandalone(isAppInstalled);

        // Check if user previously dismissed the prompt
        const hasDismissed = localStorage.getItem("installPromptDismissed") === "true";

        if (isAppInstalled || hasDismissed) {
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // iOS doesn't support beforeinstallprompt, show custom prompt immediately
            setShowPrompt(true);
        }

        // Android / Chrome desktop support
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("installPromptDismissed", "true");
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-slate-800/95 backdrop-blur-md border-t border-slate-700 shadow-2xl safe-area-pb">
            <div className="max-w-md mx-auto relative flex items-start gap-4">
                <button
                    onClick={handleDismiss}
                    className="absolute -top-2 -right-2 p-2 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex-shrink-0 w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center p-2 mt-1">
                    <Image src="/logo-192.svg" alt="App Logo" width={48} height={48} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1">
                    <h3 className="text-white font-semibold text-base mb-1">Install Nexus App</h3>

                    {isIOS ? (
                        <div className="text-slate-300 text-sm leading-snug">
                            To install this app on your iPhone: tap{" "}
                            <span className="inline-block align-middle mx-1 p-1 bg-slate-700 rounded"><Share className="w-3 h-3 text-sky-400" /></span>
                            then scroll down and tap{" "}
                            <strong className="text-white whitespace-nowrap">
                                <PlusSquare className="w-3 h-3 inline mr-1" />Add to Home Screen
                            </strong>.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-slate-300 text-sm leading-snug">
                                Install our app for quicker access and a better mobile experience.
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="bg-sky-500 hover:bg-sky-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                            >
                                <Download className="w-4 h-4" />
                                Install App
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
