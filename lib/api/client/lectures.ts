import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLecturesAction,
  getLectureByIdAction,
  createLectureAction,
  updateLectureAction,
  deleteLectureAction,
} from "@/lib/api/server";
import type { CreateLecturePayload, UpdateLecturePayload } from "@/lib/types";
import { dashboardKeys } from "./dashboard";

// ── Query keys ─────────────────────────────────────────────────────────────
export const lectureKeys = {
  all: ["lectures"] as const,
  list: (moduleId?: string) => [...lectureKeys.all, "list", moduleId] as const,
  byId: (id: string) => [...lectureKeys.all, "detail", id] as const,
};

// ── useLectures ────────────────────────────────────────────────────────────
export function useLectures(moduleId?: string) {
  return useQuery({
    queryKey: lectureKeys.list(moduleId),
    queryFn: () => getLecturesAction(moduleId),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useLectureById ─────────────────────────────────────────────────────────
export function useLectureById(id: string) {
  return useQuery({
    queryKey: lectureKeys.byId(id),
    queryFn: () => getLectureByIdAction(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data,
  });
}

// ── useCreateLecture ───────────────────────────────────────────────────────
export function useCreateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLecturePayload) => createLectureAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: lectureKeys.all });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.recentLectures() });
      }
    },
  });
}

// ── useUpdateLecture ───────────────────────────────────────────────────────
export function useUpdateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLecturePayload) => updateLectureAction(payload),
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: lectureKeys.all });
        queryClient.invalidateQueries({ queryKey: lectureKeys.byId(data.data.id) });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.recentLectures() });
      }
    },
  });
}

// ── useDeleteLecture ───────────────────────────────────────────────────────
export function useDeleteLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lectureId: string) => deleteLectureAction(lectureId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: lectureKeys.all });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.recentLectures() });
      }
    },
  });
}
