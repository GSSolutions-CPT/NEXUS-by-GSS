import Navigation from "@/components/layout/Navigation"
import Link from "next/link"

export const metadata = {
  title: "Terms of Service | Global Security Solutions",
  description: "Terms of Service for the Nexus Visitor Management System.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-sky-500/30">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Terms of Service</h1>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="text-lg text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString("en-ZA", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Nexus Visitor Management System provided by Global Security Solutions, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the system.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use of the System</h2>
          <p>
            The Nexus platform is designed to facilitate secure and efficient visitor management. You agree to use the system only for legitimate access control purposes. You may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Generate unauthorized access passes.</li>
            <li>Share your login credentials with third parties.</li>
            <li>Attempt to bypass or hack the physical or digital security mechanisms.</li>
            <li>Use the system for any illegal or malicious activity.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Responsibility for Visitors</h2>
          <p>
            Residents and unit owners are responsible for the conduct of the visitors they invite via the Nexus platform. Creating a visitor pass constitutes authorization for that individual to enter the secured premises under the rules of the estate or building.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Privacy and Data Collection</h2>
          <p>
            Your use of the system is also governed by our <Link href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">Privacy Policy</Link>, which details how we handle your personal data in compliance with POPIA.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Modifications and Termination</h2>
          <p>
            We reserve the right to restrict, suspend, or terminate your access to the system if you violate these terms. We may also update these terms from time to time; continued use constitutes acceptance of any changes.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            Global Security Solutions provides the Nexus platform "as is". While we strive for maximum uptime and security, we are not liable for incidental damages, unauthorized physical access due to hardware failure, or service interruptions caused by internet or power outages.
          </p>
        </div>
      </main>
    </div>
  )
}
