import { Separator } from "@/components/ui/separator";

export function AuthDivider({ text = "or" }: { text?: string }) {
  return (
    <div className="relative flex items-center gap-4 py-2">
      <Separator className="flex-1 bg-slate-700" />
      <span className="text-xs text-slate-500 uppercase tracking-wider shrink-0">
        {text}
      </span>
      <Separator className="flex-1 bg-slate-700" />
    </div>
  );
}
