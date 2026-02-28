"use server";

import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  AdminStats,
  AdminLecturer,
  CreateLecturerPayload,
} from "@/lib/types";

// ── Helper: assert admin role ──────────────────────────────────────────────
async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "admin") return null;
  return session;
}

// ── Admin Dashboard Stats ──────────────────────────────────────────────────
export async function getAdminStatsAction(): Promise<ApiResponse<AdminStats>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { count: totalLecturers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "lecturer");

    const { count: totalStudents } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    const { count: activeStudents } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true);

    const { count: studentsWithRfid } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true)
      .not("rfid", "is", null);

    const { count: totalModules } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: totalLectures } = await supabase
      .from("lectures")
      .select("id", { count: "exact", head: true });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: lecturesToday } = await supabase
      .from("lectures")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString());

    let overallRate = 0;
    const { count: totalAttendance } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true });

    const { count: presentAttendance } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("status", "PRESENT");

    if (totalAttendance && totalAttendance > 0) {
      overallRate = Math.round(((presentAttendance ?? 0) / totalAttendance) * 100);
    }

    return {
      success: true,
      message: "Admin stats fetched",
      data: {
        total_lecturers: totalLecturers ?? 0,
        total_students: totalStudents ?? 0,
        total_modules: totalModules ?? 0,
        total_lectures: totalLectures ?? 0,
        active_students: activeStudents ?? 0,
        students_with_rfid: studentsWithRfid ?? 0,
        overall_attendance_rate: overallRate,
        lectures_today: lecturesToday ?? 0,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get All Lecturers ──────────────────────────────────────────────────────
export async function getAdminLecturersAction(): Promise<ApiResponse<AdminLecturer[]>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { data: lecturers, error } = await supabase
      .from("users")
      .select("id, name, email, is_active, created_at")
      .eq("role", "lecturer")
      .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message };

    const result: AdminLecturer[] = [];

    for (const lec of lecturers ?? []) {
      const { count: moduleCount } = await supabase
        .from("modules")
        .select("id", { count: "exact", head: true })
        .eq("lecturer_id", lec.id)
        .eq("is_active", true);

      result.push({
        ...lec,
        module_count: moduleCount ?? 0,
      });
    }

    return { success: true, message: "Lecturers fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Create Lecturer (Admin Only) ───────────────────────────────────────────
export async function createLecturerAction(
  payload: CreateLecturerPayload
): Promise<ApiResponse<{ id: string; name: string; email: string }>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { name, email, password } = payload;

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return { success: false, message: "An account with this email already exists" };
    }

    if (!password || password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "lecturer",
        is_active: true,
      })
      .select("id, name, email")
      .single();

    if (error) {
      console.error("Create lecturer error:", error);
      return { success: false, message: "Failed to create lecturer account" };
    }

    return {
      success: true,
      message: "Lecturer created successfully",
      data: newUser,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Toggle Lecturer Active Status ──────────────────────────────────────────
export async function toggleLecturerActiveAction(
  lecturerId: string,
  isActive: boolean
): Promise<ApiResponse> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { error } = await supabase
      .from("users")
      .update({ is_active: isActive })
      .eq("id", lecturerId)
      .eq("role", "lecturer");

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `Lecturer ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Delete Lecturer ────────────────────────────────────────────────────────
export async function deleteLecturerAction(lecturerId: string): Promise<ApiResponse> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", lecturerId)
      .eq("role", "lecturer");

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Lecturer deleted successfully" };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Admin: Get All Students ────────────────────────────────────────────────
export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  index_number: string | null;
  degree: string | null;
  batch: number | null;
  rfid: string | null;
  is_active: boolean;
  created_at: string;
  module_count: number;
}

export async function getAdminStudentsAction(): Promise<ApiResponse<AdminStudent[]>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { data: students, error } = await supabase
      .from("users")
      .select("id, name, email, index_number, degree, batch, rfid, is_active, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message };

    const result: AdminStudent[] = [];

    for (const stu of students ?? []) {
      const { count: moduleCount } = await supabase
        .from("module_students")
        .select("module_id", { count: "exact", head: true })
        .eq("student_id", stu.id);

      result.push({
        ...stu,
        module_count: moduleCount ?? 0,
      });
    }

    return { success: true, message: "Students fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Admin: Toggle Student Active ───────────────────────────────────────────
export async function toggleStudentActiveAction(
  studentId: string,
  isActive: boolean
): Promise<ApiResponse> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { error } = await supabase
      .from("users")
      .update({ is_active: isActive })
      .eq("id", studentId)
      .eq("role", "student");

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `Student ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Admin: Get All Modules ─────────────────────────────────────────────────
export interface AdminModule {
  id: string;
  code: string;
  name: string;
  lecturer_name: string;
  lecturer_email: string;
  credits: number | null;
  semester: number | null;
  is_active: boolean;
  student_count: number;
  lecture_count: number;
  created_at: string;
}

export async function getAdminModulesAction(): Promise<ApiResponse<AdminModule[]>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const { data: modules, error } = await supabase
      .from("modules")
      .select("id, code, name, lecturer_id, credits, semester, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message };

    const result: AdminModule[] = [];

    for (const mod of modules ?? []) {
      const { data: lecturer } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", mod.lecturer_id)
        .single();

      const { count: studentCount } = await supabase
        .from("module_students")
        .select("student_id", { count: "exact", head: true })
        .eq("module_id", mod.id);

      const { count: lectureCount } = await supabase
        .from("lectures")
        .select("id", { count: "exact", head: true })
        .eq("module_id", mod.id);

      result.push({
        id: mod.id,
        code: mod.code,
        name: mod.name,
        lecturer_name: lecturer?.name ?? "Unknown",
        lecturer_email: lecturer?.email ?? "",
        credits: mod.credits,
        semester: mod.semester,
        is_active: mod.is_active,
        student_count: studentCount ?? 0,
        lecture_count: lectureCount ?? 0,
        created_at: mod.created_at,
      });
    }

    return { success: true, message: "Modules fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Admin: Get Recent Activity ─────────────────────────────────────────────
export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export async function getAdminRecentActivityAction(): Promise<ApiResponse<AdminActivity[]>> {
  try {
    const session = await requireAdmin();
    if (!session) return { success: false, message: "Unauthorized — admin only" };

    const activities: AdminActivity[] = [];

    // Recent lectures created
    const { data: recentLectures } = await supabase
      .from("lectures")
      .select("id, title, created_at, module_id")
      .order("created_at", { ascending: false })
      .limit(5);

    for (const lec of recentLectures ?? []) {
      const { data: mod } = await supabase
        .from("modules")
        .select("code")
        .eq("id", lec.module_id)
        .single();

      activities.push({
        id: `lec-${lec.id}`,
        type: "lecture",
        description: `Lecture "${lec.title}" created for ${mod?.code ?? "N/A"}`,
        timestamp: lec.created_at,
      });
    }

    // Recent students registered
    const { data: recentStudents } = await supabase
      .from("users")
      .select("id, name, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(5);

    for (const stu of recentStudents ?? []) {
      activities.push({
        id: `stu-${stu.id}`,
        type: "student",
        description: `Student "${stu.name}" registered`,
        timestamp: stu.created_at,
      });
    }

    // Recent attendance records
    const { data: recentAttendance } = await supabase
      .from("attendance")
      .select("id, student_id, lecture_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    for (const att of recentAttendance ?? []) {
      const { data: student } = await supabase
        .from("users")
        .select("name")
        .eq("id", att.student_id)
        .single();

      activities.push({
        id: `att-${att.id}`,
        type: "attendance",
        description: `${student?.name ?? "Student"} marked ${att.status}`,
        timestamp: att.created_at,
      });
    }

    // Sort by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      message: "Activity fetched",
      data: activities.slice(0, 10),
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
