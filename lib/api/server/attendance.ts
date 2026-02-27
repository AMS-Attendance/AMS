"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  AttendanceWithStudent,
  MarkAttendancePayload,
} from "@/lib/types";

// ── Get Attendance for a Lecture ────────────────────────────────────────────
export async function getLectureAttendanceAction(
  lectureId: string
): Promise<ApiResponse<AttendanceWithStudent[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Verify ownership
    const { data: lec } = await supabase
      .from("lectures")
      .select("module_id")
      .eq("id", lectureId)
      .single();

    if (!lec) return { success: false, message: "Lecture not found" };

    const { data: mod } = await supabase
      .from("modules")
      .select("id")
      .eq("id", lec.module_id)
      .eq("lecturer_id", session.id)
      .single();

    if (!mod) return { success: false, message: "Unauthorized" };

    const { data: attendanceRecords, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("lecture_id", lectureId)
      .order("timestamp", { ascending: true });

    if (error) return { success: false, message: error.message };

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { success: true, message: "No attendance records", data: [] };
    }

    // Get student details
    const studentIds = attendanceRecords.map((a: { student_id: string }) => a.student_id);
    const { data: students } = await supabase
      .from("users")
      .select("id, name, email, index_number, rfid")
      .in("id", studentIds);

    const studentMap = new Map(
      (students ?? []).map((s: { id: string; name: string; email: string; index_number: string | null; rfid: string | null }) => [s.id, s])
    );

    const result: AttendanceWithStudent[] = attendanceRecords.map(
      (a: Record<string, unknown>) => {
        const student = studentMap.get(a.student_id as string) as { name: string; email: string; index_number: string | null; rfid: string | null } | undefined;
        return {
          id: a.id as string,
          lecture_id: a.lecture_id as string,
          student_id: a.student_id as string,
          timestamp: a.timestamp as string,
          status: a.status as AttendanceWithStudent["status"],
          marked_by: a.marked_by as string | null,
          method: a.method as AttendanceWithStudent["method"],
          remarks: a.remarks as string | null,
          created_at: a.created_at as string,
          updated_at: a.updated_at as string,
          student_name: student?.name ?? "Unknown",
          student_email: student?.email ?? "",
          index_number: student?.index_number ?? null,
          rfid: student?.rfid ?? null,
        };
      }
    );

    return { success: true, message: "Attendance fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Mark Attendance ────────────────────────────────────────────────────────
export async function markAttendanceAction(
  payload: MarkAttendancePayload
): Promise<ApiResponse<AttendanceWithStudent>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("attendance")
      .upsert(
        {
          lecture_id: payload.lecture_id,
          student_id: payload.student_id,
          status: payload.status ?? "PRESENT",
          method: payload.method ?? "manual",
          marked_by: session.id,
          remarks: payload.remarks,
          timestamp: new Date().toISOString(),
        },
        { onConflict: "lecture_id,student_id" }
      )
      .select()
      .single();

    if (error) return { success: false, message: error.message };

    // Get student info
    const { data: student } = await supabase
      .from("users")
      .select("name, email, index_number, rfid")
      .eq("id", payload.student_id)
      .single();

    const result: AttendanceWithStudent = {
      ...data,
      student_name: student?.name ?? "Unknown",
      student_email: student?.email ?? "",
      index_number: student?.index_number ?? null,
      rfid: student?.rfid ?? null,
    };

    return { success: true, message: "Attendance marked", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Bulk Mark Attendance ───────────────────────────────────────────────────
export async function bulkMarkAttendanceAction(
  lectureId: string,
  records: Array<{ student_id: string; status: string }>
): Promise<ApiResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const rows = records.map((r) => ({
      lecture_id: lectureId,
      student_id: r.student_id,
      status: r.status,
      method: "manual" as const,
      marked_by: session.id,
      timestamp: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "lecture_id,student_id" });

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `${records.length} attendance record(s) marked`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
