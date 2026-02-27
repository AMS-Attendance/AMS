function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface DashboardMockupStudentRow {
  name: string;
  id: string;
  time: string;
  ok: boolean;
}

const mockStudents: DashboardMockupStudentRow[] = [
  { name: "Amal Perera", id: "CS21001", time: "08:02", ok: true },
  { name: "Nimesha Silva", id: "CS21034", time: "08:05", ok: true },
  { name: "Ravindu Wijesekara", id: "CS21048", time: "—", ok: false },
  { name: "Sachini Fernando", id: "CS21012", time: "08:11", ok: true },
];

const weeklyData = [70, 85, 60, 90, 75, 87, 92];
const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export function DashboardMockup() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl">
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-800/50">
          <div className="flex gap-1.5">
            {["bg-rose-500", "bg-amber-500", "bg-emerald-500"].map((c) => (
              <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
            ))}
          </div>
          <div className="flex-1 mx-4 h-5 bg-slate-700 rounded-md flex items-center px-2">
            <span className="font-mono text-[10px] text-slate-500">
              ams.university.edu/dashboard
            </span>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Today&apos;s Lectures</div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                CS3012 — DSA
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Attendance Rate</span>
              <span className="text-white font-semibold">87%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[87%] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
            </div>
          </div>

          {/* Student rows */}
          {mockStudents.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{s.name}</div>
                <div className="text-slate-500 text-[10px] font-mono">{s.id}</div>
              </div>
              <div
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-md",
                  s.ok
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400",
                )}
              >
                {s.ok ? `✓ ${s.time}` : "Absent"}
              </div>
            </div>
          ))}

          {/* Mini chart */}
          <div className="bg-slate-800/50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-3">Weekly Attendance</div>
            <div className="flex items-end gap-2 h-16">
              {weeklyData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${v * 0.64}px` }}
                  />
                  <div className="text-[9px] text-slate-600 font-mono">
                    {dayLabels[i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
        Real-time
      </div>
    </div>
  );
}
