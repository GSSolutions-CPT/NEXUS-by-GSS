import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Privacy Policy | Global Security Solutions",
  description: "Privacy Policy for Global Security Solutions and the Nexus platform.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-sky-500/30">
      
      {/* Header with Back Button */}
      <header className="w-full border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-192.svg" alt="Logo" width={32} height={32} />
            <span className="font-bold tracking-tight text-white hidden sm:block">Nexus Portal</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="text-lg text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString("en-ZA", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <p><strong>Owner and Data Controller</strong><br/>
          Global Security Solutions<br/>
          Durbanville, Cape Town, South Africa<br/>
          support@globalsecuritysolutions.co.za</p>

          <p>
            Global Security Solutions respects the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit or interact with our visitor management platform and mobile endpoints, &quot;Nexus VMS&quot; (the &quot;Application&quot;). Please read this Privacy Policy carefully. IF YOU DO NOT AGREE WITH THE TERMS OF THIS PRIVACY POLICY, PLEASE DO NOT ACCESS THE APPLICATION.
          </p>

          <p>
            We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the &quot;Last updated&quot; date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates. You will be deemed to have been made aware of, will be subject to, and will be deemed to have accepted the changes in any revised Privacy Policy by your continued use of the Application after the date such revised Privacy Policy is posted.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Collection of Your Information</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use, and includes:</p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Personal Data</h3>
          <p>
            Demographic and other personally identifiable information (such as your first name, last name, and phone number) that you or your managing host voluntarily provides to us when generating a temporary access pass or participating in activities related to the Application. All personal data processed for access control will be accessible only by authorized property managers and stationed security personnel to approve and verify your entry.
          </p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Derivative Data</h3>
          <p>
            Information our servers automatically collect when you access the Application, such as your IP address, browser type, and native actions that are integral to the Application (e.g., scanning a QR code or entering a PIN).
          </p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Geo-Location Information</h3>
          <p>
            We may request access or permission to track location-based information from your mobile device while you are using the Application to provide location-based services (like proximity gate opening). If you wish to change our access or permissions, you may do so in your device&apos;s settings.
          </p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Mobile Device Access</h3>
          <p>We may request access or permission to certain features from your mobile device, including:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Contacts list:</strong> To allow property residents to easily import a contact when adding a visitor to the access list.</li>
            <li><strong>Camera usage:</strong> To scan QR codes at the gate or for security personnel to scan vehicle licenses/IDs where required by the specific estate.</li>
          </ul>
          <p className="mt-4">
            If you wish to change our access or permissions, you may do so in your device&apos;s settings, however this will affect your experience in the Application.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Use of Your Information</h2>
          <p>Having accurate information about you permits us to provide a secure, smooth, and efficient visitor experience. Specifically, we may use information collected about you via the Application to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Generate and issue digital access credentials (PINs and QR codes).</li>
            <li>Maintain secure audit logs of physical access entries and exits for community safety.</li>
            <li>Compile anonymous statistical data and analysis for estate management.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            <li>Notify you of access pass updates, expirations, or revocations.</li>
            <li>Prevent fraudulent access, monitor against security breaches, and protect against criminal activity.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Disclosure of Your Information</h2>
          <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">By Law or to Protect Rights</h3>
          <p>
            If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
          </p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Property Managers and Security Guards</h3>
          <p>
            If you are invited to a property, your basic details (name, pass status, and vehicle info if applicable) will be visible to the property administrators and the on-site security personnel managing the entry points.
          </p>

          <h3 className="text-xl font-medium text-white mt-6 mb-2">Tracking Technologies</h3>
          <p>
            We may use cookies, tracking pixels, and other tracking technologies on the Application to help customize the Application and improve your experience. Your personal access logs are fundamentally secure and not shared with third-party tracking or advertising networks.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4 border-t border-slate-800 pt-8">Data Subject Participation (POPI Act)</h2>
          <p>
            Under the Protection of Personal Information Act (POPIA), you are entitled to request the correction or deletion/redaction of your personal information once it is no longer strictly required for historical security auditing. You can initiate this via the digital guest pass link provided to you, or by contacting the specific property administrator.
          </p>
        </div>
      </main>
    </div>
  )
}
