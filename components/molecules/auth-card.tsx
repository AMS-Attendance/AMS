import { Radio } from "lucide-react";
import Link from "next/link";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-[#050d1f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects matching landing page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.2) 0%, transparent 70%)",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-600/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Radio size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-2xl tracking-tight">
            AMS<span className="text-blue-400">.</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {title}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">{description}</p>
          </div>

          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="text-center mt-6 text-sm text-slate-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
