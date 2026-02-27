import type { Step } from "@/lib/types/homepage";

export function StepCard({ num, icon: Icon, title, desc }: Step) {
  return (
    <div className="flex gap-5 group">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 group-hover:bg-blue-600/40 transition-colors">
          {num}
        </div>
        {num < 4 && (
          <div className="w-px flex-1 bg-gradient-to-b from-blue-500/30 to-transparent mt-2" />
        )}
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon size={16} className="text-blue-400" />
          <h4 className="text-white font-semibold text-sm">{title}</h4>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
