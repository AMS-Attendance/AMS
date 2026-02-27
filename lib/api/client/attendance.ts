import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLectureAttendanceAction,
  markAttendanceAction,
  bulkMarkAttendanceAction,
} from "@/lib/api/server";
import type { MarkAttendancePayload } from "@/lib/types";
import { lectureKeys } from "./lectures";
import { dashboardKeys } from "./dashboard";

// ── Query keys ─────────────────────────────────────────────────────────────
export const attendanceKeys = {
  all: ["attendance"] as const,
  byLecture: (lectureId: string) =>
    [...attendanceKeys.all, "lecture", lectureId] as const,
};

// ── useLectureAttendance ───────────────────────────────────────────────────
export function useLectureAttendance(lectureId: string) {
  return useQuery({
    queryKey: attendanceKeys.byLecture(lectureId),
    queryFn: () => getLectureAttendanceAction(lectureId),
    enabled: !!lectureId,
    staleTime: 1000 * 15, // 15 seconds for live data
    select: (res) => res.data ?? [],
  });
}

// ── useMarkAttendance ──────────────────────────────────────────────────────
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkAttendancePayload) => markAttendanceAction(payload),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.byLecture(variables.lecture_id),
        });
        queryClient.invalidateQueries({ queryKey: lectureKeys.all });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}

// ── useBulkMarkAttendance ──────────────────────────────────────────────────
export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
      records,
    }: {
      lectureId: string;
      records: Array<{ student_id: string; status: string }>;
    }) => bulkMarkAttendanceAction(lectureId, records),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.byLecture(variables.lectureId),
        });
        queryClient.invalidateQueries({ queryKey: lectureKeys.all });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}
