import Image from "next/image";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center p-8 sm:p-12">
        {/* Glassmorphic Card */}
        <div className="w-full rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6 text-center">

            <Image
              src="/logo-512.svg"
              alt="Global Security Solutions Logo"
              width={120}
              height={120}
              priority
              className="drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            />

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                Nexus Portal
              </h1>
              <p className="text-sm text-slate-400">
                Authorized Personnel Only
              </p>
            </div>

            <form className="w-full space-y-4 mt-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</label>
                <input
                  type="email"
                  placeholder="admin@globalsecurity.co.za"
                  className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-12 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>

              <button
                type="button"
                className="w-full h-12 mt-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] active:scale-[0.98]"
              >
                Sign In to Nexus
              </button>
            </form>

          </div>
        </div>

        {/* Footer Admin Watermark */}
        <p className="mt-8 text-xs text-slate-500 text-center max-w-xs">
          System engineered and maintained by <br />
          <a href="https://www.globalsecuritysolutions.co.za/" target="_blank" className="text-sky-500/80 hover:text-sky-400 font-medium transition-colors">Global Security Solutions</a>
          <br />
          <span className="mt-2 block">24/7 Support: <a href="https://wa.me/27629558559" target="_blank" className="hover:text-slate-300">062 955 8559</a></span>
        </p>

      </main>
    </div>
  );
}
