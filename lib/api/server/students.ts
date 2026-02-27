"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  Student,
  StudentWithAttendance,
} from "@/lib/types";

// ── Get All Students (for lecturer) ────────────────────────────────────────
export async function getStudentsAction(filters?: {
  batch?: number;
  degree?: string;
  search?: string;
}): Promise<ApiResponse<Student[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    let query = supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .eq("role", "student")
      .eq("is_active", true)
      .order("name");

    if (filters?.batch) {
      query = query.eq("batch", filters.batch);
    }
    if (filters?.degree) {
      query = query.eq("degree", filters.degree);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,index_number.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Students fetched", data: data ?? [] };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Students with Attendance for a Module ──────────────────────────────
export async function getStudentsWithAttendanceAction(
  moduleId: string
): Promise<ApiResponse<StudentWithAttendance[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Verify module belongs to lecturer
    const { data: mod } = await supabase
      .from("modules")
      .select("id")
      .eq("id", moduleId)
      .eq("lecturer_id", session.id)
      .single();

    if (!mod) return { success: false, message: "Module not found" };

    // Get enrolled students
    const { data: enrollments } = await supabase
      .from("module_students")
      .select("student_id")
      .eq("module_id", moduleId);

    const studentIds = (enrollments ?? []).map((e: { student_id: string }) => e.student_id);
    if (studentIds.length === 0) return { success: true, message: "No students", data: [] };

    // Get student details
    const { data: students } = await supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .in("id", studentIds)
      .order("name");

    // Get total lectures for this module
    const { data: lectures } = await supabase
      .from("lectures")
      .select("id")
      .eq("module_id", moduleId);

    const totalLectures = (lectures ?? []).length;
    const lectureIds = (lectures ?? []).map((l: { id: string }) => l.id);

    const result: StudentWithAttendance[] = [];

    for (const student of students ?? []) {
      let attendedLectures = 0;

      if (lectureIds.length > 0) {
        const { count } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("student_id", student.id)
          .in("lecture_id", lectureIds)
          .in("status", ["PRESENT", "LATE"]);

        attendedLectures = count ?? 0;
      }

      result.push({
        ...student,
        total_lectures: totalLectures,
        attended_lectures: attendedLectures,
        attendance_percentage:
          totalLectures > 0
            ? Math.round((attendedLectures / totalLectures) * 100)
            : 0,
      });
    }

    return { success: true, message: "Students fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Distinct Batches ───────────────────────────────────────────────────
export async function getBatchesAction(): Promise<ApiResponse<number[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("users")
      .select("batch")
      .eq("role", "student")
      .eq("is_active", true)
      .not("batch", "is", null)
      .order("batch");

    if (error) return { success: false, message: error.message };

    const batches = [...new Set((data ?? []).map((d: { batch: number }) => d.batch))];

    return { success: true, message: "Batches fetched", data: batches };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Distinct Degrees ───────────────────────────────────────────────────
export async function getDegreesAction(): Promise<ApiResponse<string[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("users")
      .select("degree")
      .eq("role", "student")
      .eq("is_active", true)
      .not("degree", "is", null)
      .order("degree");

    if (error) return { success: false, message: error.message };

    const degrees = [...new Set((data ?? []).map((d: { degree: string }) => d.degree))];

    return { success: true, message: "Degrees fetched", data: degrees };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
