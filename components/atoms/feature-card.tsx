import type { Feature } from "@/lib/types/homepage";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type FeatureCardProps = Feature;

export function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent = "blue",
  delay = 0,
}: FeatureCardProps) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  };

  return (
    <div
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center border mb-4",
          colors[accent],
        )}
      >
        <Icon size={22} />
      </div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
