"use server";

import bcrypt from "bcryptjs";
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
          .eq("status", "PRESENT");

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

// ── Check if RFID is already registered ────────────────────────────────────
export async function checkRfidAction(
  rfid: string
): Promise<ApiResponse<Student | null>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .eq("rfid", rfid)
      .eq("role", "student")
      .single();

    if (error || !data) {
      return { success: true, message: "RFID not registered", data: null };
    }

    return { success: true, message: "RFID already registered", data };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Search Students (by name, email, or index number) ──────────────────────
export async function searchStudentsAction(
  query: string
): Promise<ApiResponse<Student[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    if (!query || query.trim().length < 2) {
      return { success: false, message: "Search query must be at least 2 characters" };
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .eq("role", "student")
      .eq("is_active", true)
      .or(
        `name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%,index_number.ilike.%${query.trim()}%`
      )
      .order("name")
      .limit(20);

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Students found", data: data ?? [] };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Assign RFID to Existing Student ────────────────────────────────────────
export async function assignRfidAction(
  studentId: string,
  rfid: string
): Promise<ApiResponse<Student>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Check if RFID is already taken
    const { data: existing } = await supabase
      .from("users")
      .select("id, name")
      .eq("rfid", rfid)
      .single();

    if (existing) {
      return {
        success: false,
        message: `RFID already assigned to ${(existing as { name: string }).name}`,
      };
    }

    // Check if student already has an RFID
    const { data: student } = await supabase
      .from("users")
      .select("id, rfid")
      .eq("id", studentId)
      .single();

    if (!student) return { success: false, message: "Student not found" };
    if ((student as { rfid: string | null }).rfid) {
      return { success: false, message: "Student already has an RFID assigned" };
    }

    const { data, error } = await supabase
      .from("users")
      .update({ rfid })
      .eq("id", studentId)
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .single();

    if (error) return { success: false, message: error.message };

    return { success: true, message: "RFID assigned successfully", data };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Register New Student with RFID ─────────────────────────────────────────
export interface RegisterStudentPayload {
  name: string;
  email: string;
  password: string;
  index_number: string;
  rfid: string;
  degree?: string;
  batch?: number;
}

export async function registerStudentAction(
  payload: RegisterStudentPayload
): Promise<ApiResponse<Student>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", payload.email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      return { success: false, message: "An account with this email already exists" };
    }

    // Check if index number already exists
    const { data: existingIndex } = await supabase
      .from("users")
      .select("id")
      .eq("index_number", payload.index_number.trim())
      .single();

    if (existingIndex) {
      return { success: false, message: "A student with this index number already exists" };
    }

    // Check if RFID already taken
    const { data: existingRfid } = await supabase
      .from("users")
      .select("id")
      .eq("rfid", payload.rfid)
      .single();

    if (existingRfid) {
      return { success: false, message: "This RFID is already assigned to another student" };
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: payload.name.trim(),
        email: payload.email.toLowerCase().trim(),
        password: hashedPassword,
        role: "student",
        rfid: payload.rfid,
        index_number: payload.index_number.trim(),
        degree: payload.degree?.trim() || null,
        batch: payload.batch ?? null,
        is_active: true,
      })
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Duplicate entry. Check email, index number, or RFID." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Student registered successfully", data };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
