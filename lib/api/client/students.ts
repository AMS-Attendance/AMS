import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStudentsAction,
  getStudentsWithAttendanceAction,
  getBatchesAction,
  getDegreesAction,
  checkRfidAction,
  searchStudentsAction,
  assignRfidAction,
  registerStudentAction,
} from "@/lib/api/server";
import type { RegisterStudentPayload } from "@/lib/api/server";

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

// ── useCheckRfid ───────────────────────────────────────────────────────────
export function useCheckRfid() {
  return useMutation({
    mutationFn: (rfid: string) => checkRfidAction(rfid),
  });
}

// ── useSearchStudents ──────────────────────────────────────────────────────
export function useSearchStudents() {
  return useMutation({
    mutationFn: (query: string) => searchStudentsAction(query),
  });
}

// ── useAssignRfid ──────────────────────────────────────────────────────────
export function useAssignRfid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, rfid }: { studentId: string; rfid: string }) =>
      assignRfidAction(studentId, rfid),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: studentKeys.all });
      }
    },
  });
}

// ── useRegisterStudent ─────────────────────────────────────────────────────
export function useRegisterStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterStudentPayload) => registerStudentAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: studentKeys.all });
      }
    },
  });
}
