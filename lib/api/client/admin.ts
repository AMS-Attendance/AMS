import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStatsAction,
  getAdminLecturersAction,
  createLecturerAction,
  toggleLecturerActiveAction,
  deleteLecturerAction,
  getAdminStudentsAction,
  toggleStudentActiveAction,
  getAdminModulesAction,
  getAdminRecentActivityAction,
} from "@/lib/api/server";
import type { CreateLecturerPayload } from "@/lib/types";

// ── Query keys ─────────────────────────────────────────────────────────────
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  lecturers: () => [...adminKeys.all, "lecturers"] as const,
  students: () => [...adminKeys.all, "students"] as const,
  modules: () => [...adminKeys.all, "modules"] as const,
  activity: () => [...adminKeys.all, "activity"] as const,
};

// ── useAdminStats ──────────────────────────────────────────────────────────
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => getAdminStatsAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data,
  });
}

// ── useAdminLecturers ──────────────────────────────────────────────────────
export function useAdminLecturers() {
  return useQuery({
    queryKey: adminKeys.lecturers(),
    queryFn: () => getAdminLecturersAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useCreateLecturer ──────────────────────────────────────────────────────
export function useCreateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLecturerPayload) => createLecturerAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: adminKeys.lecturers() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
  });
}

// ── useToggleLecturerActive ────────────────────────────────────────────────
export function useToggleLecturerActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleLecturerActiveAction(id, isActive),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: adminKeys.lecturers() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
  });
}

// ── useDeleteLecturer ──────────────────────────────────────────────────────
export function useDeleteLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLecturerAction(id),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: adminKeys.lecturers() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
  });
}

// ── useAdminStudents ───────────────────────────────────────────────────────
export function useAdminStudents() {
  return useQuery({
    queryKey: adminKeys.students(),
    queryFn: () => getAdminStudentsAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useToggleStudentActive ─────────────────────────────────────────────────
export function useToggleStudentActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleStudentActiveAction(id, isActive),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: adminKeys.students() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
  });
}

// ── useAdminModules ────────────────────────────────────────────────────────
export function useAdminModules() {
  return useQuery({
    queryKey: adminKeys.modules(),
    queryFn: () => getAdminModulesAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useAdminRecentActivity ─────────────────────────────────────────────────
export function useAdminRecentActivity() {
  return useQuery({
    queryKey: adminKeys.activity(),
    queryFn: () => getAdminRecentActivityAction(),
    staleTime: 1000 * 60,
    select: (res) => res.data ?? [],
  });
}
