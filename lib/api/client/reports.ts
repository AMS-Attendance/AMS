import { useQuery } from "@tanstack/react-query";
import { getModuleAttendanceReportAction } from "@/lib/api/server/reports";

// ── Query keys ─────────────────────────────────────────────────────────────
export const reportKeys = {
  all: ["reports"] as const,
  moduleAttendance: (moduleId: string) =>
    [...reportKeys.all, "module-attendance", moduleId] as const,
};

// ── useModuleAttendanceReport ──────────────────────────────────────────────
export function useModuleAttendanceReport(moduleId: string) {
  return useQuery({
    queryKey: reportKeys.moduleAttendance(moduleId),
    queryFn: () => getModuleAttendanceReportAction(moduleId),
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? null,
  });
}
