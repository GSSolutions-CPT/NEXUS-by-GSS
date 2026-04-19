import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Terms of Service | Global Security Solutions",
  description: "Terms of Service and Conditions for the Nexus Visitor Management System.",
}

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Terms of Service & Conditions</h1>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="text-lg text-slate-400 mb-12">
            Last updated: {new Date().toLocaleDateString("en-ZA", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-16">
            
            {/* PART 1: TERMS OF USE */}
            <section>
              <h2 className="text-3xl font-bold text-white border-b border-slate-800 pb-4 mb-6">Part 1: Terms of Use</h2>
              <p>Please read these terms and conditions carefully before using our service.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Interpretation and Definitions</h3>
              <ul className="list-none space-y-2 mb-6">
                <li><strong>App / Service</strong> refers to the Nexus VMS application and associated web portals.</li>
                <li><strong>Company</strong> refers to Global Security Solutions, headquartered in Durbanville, Cape Town.</li>
                <li><strong>Property Administrator</strong> means an assigned individual or individuals who manage the Service for a specific property (e.g., an estate manager, HOA trustee, supervisor, or managing agent).</li>
                <li><strong>You/Your</strong> means the individual accessing or using the Service, or the company/legal entity on behalf of which such individual is accessing the Service.</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Acknowledgment</h3>
              <p>
                Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms apply to all users, residents, guards, and visitors who access or use the Service. By using the Service, You agree to be bound by these Terms.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Disclaimer for Our Service</h3>
              <p>
                You understand that we offer a Service to be used by property managers and security teams to manage visitor access, and an App/Portal that facilitates this Service for end-users and guests. We do not control your physical access to a specific property; this is holistically controlled by the assigned Property Administrator and their hardwired access control policies. Nexus VMS simply facilitates the digital handshake.
              </p>
              <p>
                Global Security Solutions provides this platform infrastructure, but the internal experience, communication, approval of visitors, and access schedules within a property are controlled strictly by the assigned Property Administrator.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">User Accounts & Duties</h3>
              <p>
                When You create an account or invite a guest, you must provide accurate, complete, and current information. Property owners generating invites confirm they have obtained the necessary POPI Act consent from their guests prior to uploading their details to the Service.
              </p>
              <p>
                You are responsible for safeguarding your login credentials. You are strictly forbidden from sharing your Property Administrator or Guard credentials with any unauthorized third parties.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Content and Activity Restrictions</h3>
              <p>
                You may not transmit any data that is unlawful, offensive, threatening, or intended to bypass security logic. You agree to use the Service strictly for managing legitimate access to associated properties.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Hardware and Gate Integration Disclaimer</h3>
              <p>
                Nexus VMS interfaces with on-site hardware (e.g., Impro Technologies bridges, booms, and turnstiles). While we ensure maximum uptime for our cloud infrastructure, we cannot guarantee uninterrupted gateway performance due to factors beyond our control, including local internet outages, power failures (load shedding), or hardware mechanical faults at the property.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by applicable law, in no event shall the Company be liable for any special, incidental, indirect, or consequential damages whatsoever (including damages for loss of profits, business interruption, personal injury, unauthorized property access, or loss of privacy) arising out of or in any way related to the use of or inability to use the Service or integrated third-party hardware.
              </p>
            </section>


            {/* PART 2: GENERAL T&C */}
            <section>
              <h2 className="text-3xl font-bold text-white border-b border-slate-800 pb-4 mb-6">Part 2: General Terms & Conditions</h2>
              <p>
                Welcome to Nexus VMS, operated by Global Security Solutions. By using our website and digital services, you agree to comply with and be bound by the following terms and conditions.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Purpose</h3>
              <p>
                Nexus VMS provides digital visitor management, access control integration, and security logging resources tailored for residential estates, corporate parks, and high-security communities.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Privacy Policy</h3>
              <p>
                Your privacy is critical to us. We adhere strictly to the POPI Act of South Africa. Any information provided through forms or API endpoints on our system is encrypted and strictly guarded. It will not be shared with external marketing third parties. Please refer to our complete <Link href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">Privacy Policy</Link> for details on how we collect, use, and protect your information.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Intellectual Property</h3>
              <p>
                All software mechanics, source code, UI designs, and database schemas on Nexus VMS are the exclusive intellectual property of Global Security Solutions and are protected by South African and international copyright laws. Unauthorized reproduction or reverse-engineering of the platform is strictly prohibited.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Modifications</h3>
              <p>
                We reserve the right to modify these terms and conditions at any time. Your continued use of the site after any changes constitutes acceptance of the new terms.
              </p>
            </section>


            {/* PART 3: NEXUS VMS SERVICE DISCLAIMER */}
            <section>
              <h2 className="text-3xl font-bold text-white border-b border-slate-800 pb-4 mb-6">Part 3: Nexus VMS Service Disclaimer</h2>
              <p>
                Nexus VMS by Global Security Solutions is a digital platform designed to assist communities, estates, and security personnel in managing visitor flow and access control efficiently. By using Nexus VMS, you acknowledge and agree to the following limitations of liability:
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Visitor Invitations and Contractor Access</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Digital passes and access schedules generated within the system are done so at the discretion of the respective residents, managing agents, or estate staff.</li>
                <li>Neither Global Security Solutions nor any managing agent accepts responsibility for the real-world conduct, actions, or outcomes of any visitor, contractor, or guest invited onto the premises using a Nexus VMS digital pass.</li>
                <li>All invitations are sent at the resident’s own risk. The inviter assumes responsibility for the individuals they authorize to pass through the security perimeter.</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Hardware Operation and Gate Triggers</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>The Application provides a mechanism for digital communication with physical access control systems (such as boom gates, turnstiles, and pulse relays).</li>
                <li>Global Security Solutions, estates, and community managers are not responsible for:
                  <ul className="list-[circle] pl-6 mt-2 space-y-1">
                    <li>Mechanical failures of the physical gate hardware.</li>
                    <li>Instances where localized network failures, load shedding, or Bluetooth/GSM disruptions prevent a digital pass from triggering a physical gate.</li>
                    <li>Damages to vehicles or personal injury resulting from the operation of physical boom gates or security barriers.</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Security Personnel Interactions</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Security guards stationed at entry/exit points are instructed by their respective employment companies and the estate management.</li>
                <li>While Nexus VMS facilitates the verification of digital passes, Global Security Solutions makes no guarantees regarding the alertness, protocol adherence, or actions of the on-site physical security personnel.</li>
                <li>The use of the digital scanner and Guard Dashboard is a tool to assist—not replace—vigilant human security measures.</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">General Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by South African law, Global Security Solutions, alongside associated estates, communities, and managing agents, disclaims all liability for any direct, indirect, incidental, or special damages arising from the use or attempted use of the Nexus VMS app, its APIs, or hardware bridge. This includes, but is not limited to, unauthorized access, delays at the entry gates, service interruptions, or third-party behavior.
              </p>

            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
