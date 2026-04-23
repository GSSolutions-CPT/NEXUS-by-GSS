import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Access Pass | Nexus by GSS",
    description: "View your digital visitor access pass for the secured property.",
    robots: {
        index: false,   // Don't index individual visitor passes
        follow: false,
    },
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
