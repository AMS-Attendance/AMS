import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStatsAction,
  getRecentLecturesAction,
  getModuleAttendanceSummaryAction,
} from "@/lib/api/server";

// ── Query keys ─────────────────────────────────────────────────────────────
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  recentLectures: (limit?: number) =>
    [...dashboardKeys.all, "recentLectures", limit] as const,
  moduleSummary: () => [...dashboardKeys.all, "moduleSummary"] as const,
};

// ── useDashboardStats ──────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => getDashboardStatsAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data,
  });
}

// ── useRecentLectures ──────────────────────────────────────────────────────
export function useRecentLectures(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentLectures(limit),
    queryFn: () => getRecentLecturesAction(limit),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useModuleAttendanceSummary ─────────────────────────────────────────────
export function useModuleAttendanceSummary() {
  return useQuery({
    queryKey: dashboardKeys.moduleSummary(),
    queryFn: () => getModuleAttendanceSummaryAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}
