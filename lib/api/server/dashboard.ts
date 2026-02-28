"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  DashboardStats,
  RecentLecture,
  ModuleAttendanceSummary,
} from "@/lib/types";

// ── Dashboard Stats ────────────────────────────────────────────────────────
export async function getDashboardStatsAction(): Promise<ApiResponse<DashboardStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const lecturerId = session.id;

    // Fetch modules for this lecturer
    const { data: modules, error: modErr } = await supabase
      .from("modules")
      .select("id")
      .eq("lecturer_id", lecturerId)
      .eq("is_active", true);

    if (modErr) return { success: false, message: modErr.message };

    const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);

    if (moduleIds.length === 0) {
      return {
        success: true,
        message: "No modules found",
        data: {
          total_modules: 0,
          total_lectures: 0,
          total_students: 0,
          upcoming_lectures: 0,
          completed_lectures: 0,
          overall_attendance_rate: 0,
        },
      };
    }

    // Total distinct students across all modules
    const { count: studentCount } = await supabase
      .from("module_students")
      .select("student_id", { count: "exact", head: true })
      .in("module_id", moduleIds);

    // Lectures
    const { data: lectures } = await supabase
      .from("lectures")
      .select("id, status")
      .in("module_id", moduleIds);

    const allLectures = lectures ?? [];
    const totalLectures = allLectures.length;
    const completedLectures = allLectures.filter((l: { status: string }) => l.status === "COMPLETED").length;
    const upcomingLectures = allLectures.filter((l: { status: string }) => l.status === "SCHEDULED").length;

    // Overall attendance rate
    let overallRate = 0;
    if (totalLectures > 0) {
      const lectureIds = allLectures.map((l: { id: string }) => l.id);
      const { count: totalAttendance } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .in("lecture_id", lectureIds);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .in("lecture_id", lectureIds)
        .eq("status", "PRESENT");

      if (totalAttendance && totalAttendance > 0) {
        overallRate = Math.round(((presentCount ?? 0) / totalAttendance) * 100);
      }
    }

    return {
      success: true,
      message: "Stats fetched",
      data: {
        total_modules: moduleIds.length,
        total_lectures: totalLectures,
        total_students: studentCount ?? 0,
        upcoming_lectures: upcomingLectures,
        completed_lectures: completedLectures,
        overall_attendance_rate: overallRate,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Recent Lectures ────────────────────────────────────────────────────────
export async function getRecentLecturesAction(
  limit = 5
): Promise<ApiResponse<RecentLecture[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data: modules } = await supabase
      .from("modules")
      .select("id, code, name")
      .eq("lecturer_id", session.id)
      .eq("is_active", true);

    const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
    if (moduleIds.length === 0) return { success: true, message: "No modules", data: [] };

    const moduleMap = new Map((modules ?? []).map((m: { id: string; code: string; name: string }) => [m.id, m]));

    const { data: lectures, error } = await supabase
      .from("lectures")
      .select("id, title, module_id, scheduled_at, status")
      .in("module_id", moduleIds)
      .order("scheduled_at", { ascending: false })
      .limit(limit);

    if (error) return { success: false, message: error.message };

    const result: RecentLecture[] = [];

    for (const lec of lectures ?? []) {
      const mod = moduleMap.get(lec.module_id) as { code: string; name: string } | undefined;

      // Get attendance counts
      const { count: totalStudents } = await supabase
        .from("module_students")
        .select("student_id", { count: "exact", head: true })
        .eq("module_id", lec.module_id);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("lecture_id", lec.id)
        .eq("status", "PRESENT");

      result.push({
        id: lec.id,
        title: lec.title,
        module_code: mod?.code ?? "",
        module_name: mod?.name ?? "",
        scheduled_at: lec.scheduled_at,
        status: lec.status,
        present_count: presentCount ?? 0,
        total_students: totalStudents ?? 0,
      });
    }

    return { success: true, message: "Recent lectures fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Module Attendance Summaries ────────────────────────────────────────────
export async function getModuleAttendanceSummaryAction(): Promise<
  ApiResponse<ModuleAttendanceSummary[]>
> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data: modules, error } = await supabase
      .from("modules")
      .select("id, code, name")
      .eq("lecturer_id", session.id)
      .eq("is_active", true);

    if (error) return { success: false, message: error.message };
    if (!modules || modules.length === 0) return { success: true, message: "No modules", data: [] };

    const result: ModuleAttendanceSummary[] = [];

    for (const mod of modules) {
      const { count: studentCount } = await supabase
        .from("module_students")
        .select("student_id", { count: "exact", head: true })
        .eq("module_id", mod.id);

      const { data: lectures } = await supabase
        .from("lectures")
        .select("id")
        .eq("module_id", mod.id);

      const lectureCount = (lectures ?? []).length;
      let avgRate = 0;

      if (lectureCount > 0 && (studentCount ?? 0) > 0) {
        const lectureIds = (lectures ?? []).map((l: { id: string }) => l.id);
        const { count: totalAttendance } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .in("lecture_id", lectureIds);

        const { count: presentCount } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .in("lecture_id", lectureIds)
          .eq("status", "PRESENT");

        if (totalAttendance && totalAttendance > 0) {
          avgRate = Math.round(((presentCount ?? 0) / totalAttendance) * 100);
        }
      }

      result.push({
        module_id: mod.id,
        module_code: mod.code,
        module_name: mod.name,
        student_count: studentCount ?? 0,
        lecture_count: lectureCount,
        avg_attendance_rate: avgRate,
      });
    }

    return { success: true, message: "Summary fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
