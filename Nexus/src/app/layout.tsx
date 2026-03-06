import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus | Global Security Solutions",
  description: "Visitor Management Portal secured by Global Security Solutions",
  icons: {
    icon: "/logo-192.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${montserrat.variable} font-sans antialiased bg-slate-900 text-slate-100 min-h-screen selection:bg-sky-500/30`}
      >
        {children}
      </body>
    </html>
  );
}
