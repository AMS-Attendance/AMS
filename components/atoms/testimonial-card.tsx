import { Star } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export function TestimonialCard({ quote, name, role }: Testimonial) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed flex-1">
        &quot;{quote}&quot;
      </p>
      <div>
        <div className="text-white text-sm font-semibold">{name}</div>
        <div className="text-slate-500 text-xs mt-0.5">{role}</div>
      </div>
    </div>
  );
}
