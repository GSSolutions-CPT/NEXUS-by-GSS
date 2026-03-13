import Navigation from "@/components/layout/Navigation"

export const metadata = {
  title: "Privacy Policy | Global Security Solutions",
  description: "Privacy Policy for Global Security Solutions and the Nexus platform.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-sky-500/30">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="text-lg text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString("en-ZA", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Global Security Solutions ("we", "our", "us"). We respect your privacy and are committed to protecting your personal data in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
            This Privacy Policy explains how we collect, use, store, and share your personal information when you use our services and the Nexus Visitor Management System.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
          <p>We may collect and process the following categories of personal information:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Identity Information:</strong> First name, Last name, Identity numbers (where applicable).</li>
            <li><strong>Contact Information:</strong> Phone numbers, email addresses.</li>
            <li><strong>Access Data:</strong> Entry and exit logs, PIN usage, QR code usage, physical access events.</li>
            <li><strong>Technical Data:</strong> IP addresses, browser types, device information used to access our platforms.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
          <p>Your personal information is processed for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Managing physical access to secured properties and estates.</li>
            <li>Generating and validating temporary access credentials (PINs, QR codes).</li>
            <li>Maintaining audit logs for security, safety, and incident investigation.</li>
            <li>Communicating with you regarding your access or account status.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Security</h2>
          <p>
            We deploy strict security measures, including encryption (SSL/TLS), secure credential generation, and Row Level Security (RLS) in our databases, to prevent unauthorized access, loss, or alteration of your personal data.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Your Rights (POPIA)</h2>
          <p>Under POPIA, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Request access to your personal information.</li>
            <li>Request correction or deletion of your personal information.</li>
            <li>Object to the processing of your personal information.</li>
            <li>Lodge a complaint with the Information Regulator of South Africa.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
          <p>
            For any privacy-related queries or to exercise your rights, please contact the property estate management or reach out to our support team at Global Security Solutions.
          </p>
        </div>
      </main>
    </div>
  )
}
