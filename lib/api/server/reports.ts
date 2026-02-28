"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type { ApiResponse } from "@/lib/types";

// ── Types for module attendance report ─────────────────────────────────────

export interface LectureAttendanceDetail {
  lecture_id: string;
  lecture_title: string;
  scheduled_at: string;
  status: "PRESENT" | "ABSENT" | null;
}

export interface ModuleAttendanceStudent {
  student_id: string;
  name: string;
  email: string;
  index_number: string | null;
  degree: string | null;
  batch: number | null;
  rfid: string | null;
  total_lectures: number;
  present_count: number;
  absent_count: number;
  attended_count: number; // same as present_count
  attendance_percentage: number;
  lectures: LectureAttendanceDetail[];
}

export interface ModuleAttendanceReport {
  module_id: string;
  module_code: string;
  module_name: string;
  semester: number | null;
  credits: number | null;
  total_lectures: number;
  total_students: number;
  avg_attendance_rate: number;
  lectures: Array<{
    id: string;
    title: string;
    scheduled_at: string;
    type: string;
    status: string;
  }>;
  students: ModuleAttendanceStudent[];
}

// ── Get Module Attendance Report ───────────────────────────────────────────
export async function getModuleAttendanceReportAction(
  moduleId: string
): Promise<ApiResponse<ModuleAttendanceReport>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Verify module belongs to lecturer
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .select("id, code, name, semester, credits")
      .eq("id", moduleId)
      .eq("lecturer_id", session.id)
      .single();

    if (modErr || !mod) return { success: false, message: "Module not found" };

    // Get all lectures for this module (non-cancelled), sorted by date
    const { data: lectures } = await supabase
      .from("lectures")
      .select("id, title, scheduled_at, type, status")
      .eq("module_id", moduleId)
      .neq("status", "CANCELLED")
      .order("scheduled_at", { ascending: true });

    const allLectures = lectures ?? [];
    const lectureIds = allLectures.map((l: { id: string }) => l.id);
    const totalLectures = allLectures.length;

    // Get enrolled students
    const { data: enrollments } = await supabase
      .from("module_students")
      .select("student_id")
      .eq("module_id", moduleId);

    const studentIds = (enrollments ?? []).map(
      (e: { student_id: string }) => e.student_id
    );

    if (studentIds.length === 0 || totalLectures === 0) {
      return {
        success: true,
        message: "Report generated",
        data: {
          module_id: mod.id,
          module_code: mod.code,
          module_name: mod.name,
          semester: mod.semester,
          credits: mod.credits,
          total_lectures: totalLectures,
          total_students: studentIds.length,
          avg_attendance_rate: 0,
          lectures: allLectures,
          students: [],
        },
      };
    }

    // Get student details
    const { data: students } = await supabase
      .from("users")
      .select("id, name, email, index_number, degree, batch, rfid")
      .in("id", studentIds)
      .order("name");

    // Batch-fetch all attendance records for all lectures in this module
    const { data: attendanceRecords } = await supabase
      .from("attendance")
      .select("lecture_id, student_id, status")
      .in("lecture_id", lectureIds)
      .in("student_id", studentIds);

    // Build a Map: studentId -> { lectureId -> status }
    const attendanceMap = new Map<string, Map<string, string>>();
    for (const rec of attendanceRecords ?? []) {
      if (!attendanceMap.has(rec.student_id)) {
        attendanceMap.set(rec.student_id, new Map());
      }
      attendanceMap.get(rec.student_id)!.set(rec.lecture_id, rec.status);
    }

    // Build per-student report
    let totalAttendanceRate = 0;
    const studentReports: ModuleAttendanceStudent[] = [];

    for (const student of students ?? []) {
      const studentAttMap = attendanceMap.get(student.id) ?? new Map();

      let presentCount = 0;
      let absentCount = 0;

      const lectureDetails: LectureAttendanceDetail[] = allLectures.map(
        (lec: { id: string; title: string; scheduled_at: string }) => {
          const status = studentAttMap.get(lec.id) as
            | "PRESENT"
            | "ABSENT"
            | undefined;

          if (status === "PRESENT") presentCount++;
          else absentCount++; // No record or ABSENT = absent

          return {
            lecture_id: lec.id,
            lecture_title: lec.title,
            scheduled_at: lec.scheduled_at,
            status: status ?? null,
          };
        }
      );

      const attendedCount = presentCount;
      const attendancePercentage =
        totalLectures > 0
          ? Math.round((attendedCount / totalLectures) * 100)
          : 0;

      totalAttendanceRate += attendancePercentage;

      studentReports.push({
        student_id: student.id,
        name: student.name,
        email: student.email,
        index_number: student.index_number,
        degree: student.degree,
        batch: student.batch,
        rfid: student.rfid,
        total_lectures: totalLectures,
        present_count: presentCount,
        absent_count: absentCount,
        attended_count: attendedCount,
        attendance_percentage: attendancePercentage,
        lectures: lectureDetails,
      });
    }

    const avgAttendanceRate =
      studentReports.length > 0
        ? Math.round(totalAttendanceRate / studentReports.length)
        : 0;

    return {
      success: true,
      message: "Report generated",
      data: {
        module_id: mod.id,
        module_code: mod.code,
        module_name: mod.name,
        semester: mod.semester,
        credits: mod.credits,
        total_lectures: totalLectures,
        total_students: studentReports.length,
        avg_attendance_rate: avgAttendanceRate,
        lectures: allLectures,
        students: studentReports,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
