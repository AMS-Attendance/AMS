import { useQuery } from "@tanstack/react-query";
import {
  getStudentsAction,
  getStudentsWithAttendanceAction,
  getBatchesAction,
  getDegreesAction,
} from "@/lib/api/server";

// ── Query keys ─────────────────────────────────────────────────────────────
export const studentKeys = {
  all: ["students"] as const,
  list: (filters?: { batch?: number; degree?: string; search?: string }) =>
    [...studentKeys.all, "list", filters] as const,
  withAttendance: (moduleId: string) =>
    [...studentKeys.all, "attendance", moduleId] as const,
  batches: () => [...studentKeys.all, "batches"] as const,
  degrees: () => [...studentKeys.all, "degrees"] as const,
};

// ── useStudents ────────────────────────────────────────────────────────────
export function useStudents(filters?: {
  batch?: number;
  degree?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => getStudentsAction(filters),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useStudentsWithAttendance ──────────────────────────────────────────────
export function useStudentsWithAttendance(moduleId: string) {
  return useQuery({
    queryKey: studentKeys.withAttendance(moduleId),
    queryFn: () => getStudentsWithAttendanceAction(moduleId),
    enabled: !!moduleId,
    staleTime: 1000 * 60,
    select: (res) => res.data ?? [],
  });
}

// ── useBatches ─────────────────────────────────────────────────────────────
export function useBatches() {
  return useQuery({
    queryKey: studentKeys.batches(),
    queryFn: () => getBatchesAction(),
    staleTime: 1000 * 60 * 10,
    select: (res) => res.data ?? [],
  });
}

// ── useDegrees ─────────────────────────────────────────────────────────────
export function useDegrees() {
  return useQuery({
    queryKey: studentKeys.degrees(),
    queryFn: () => getDegreesAction(),
    staleTime: 1000 * 60 * 10,
    select: (res) => res.data ?? [],
  });
}
