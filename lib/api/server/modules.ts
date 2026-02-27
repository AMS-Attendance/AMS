"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  ModuleWithStats,
  CreateModulePayload,
  UpdateModulePayload,
  Student,
  EnrollStudentsPayload,
  UnenrollStudentsPayload,
} from "@/lib/types";

// ── Get Lecturer's Modules ─────────────────────────────────────────────────
export async function getModulesAction(): Promise<ApiResponse<ModuleWithStats[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data: modules, error } = await supabase
      .from("modules")
      .select("*")
      .eq("lecturer_id", session.id)
      .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message };

    const result: ModuleWithStats[] = [];

    for (const mod of modules ?? []) {
      const { count: studentCount } = await supabase
        .from("module_students")
        .select("student_id", { count: "exact", head: true })
        .eq("module_id", mod.id);

      const { count: lectureCount } = await supabase
        .from("lectures")
        .select("id", { count: "exact", head: true })
        .eq("module_id", mod.id);

      result.push({
        ...mod,
        student_count: studentCount ?? 0,
        lecture_count: lectureCount ?? 0,
      });
    }

    return { success: true, message: "Modules fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Single Module ──────────────────────────────────────────────────────
export async function getModuleByIdAction(
  moduleId: string
): Promise<ApiResponse<ModuleWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data: mod, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .eq("lecturer_id", session.id)
      .single();

    if (error || !mod) return { success: false, message: "Module not found" };

    const { count: studentCount } = await supabase
      .from("module_students")
      .select("student_id", { count: "exact", head: true })
      .eq("module_id", mod.id);

    const { count: lectureCount } = await supabase
      .from("lectures")
      .select("id", { count: "exact", head: true })
      .eq("module_id", mod.id);

    return {
      success: true,
      message: "Module fetched",
      data: { ...mod, student_count: studentCount ?? 0, lecture_count: lectureCount ?? 0 },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Create Module ──────────────────────────────────────────────────────────
export async function createModuleAction(
  payload: CreateModulePayload
): Promise<ApiResponse<ModuleWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("modules")
      .insert({
        ...payload,
        code: payload.code.toUpperCase().trim(),
        lecturer_id: session.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A module with this code already exists" };
      }
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Module created successfully",
      data: { ...data, student_count: 0, lecture_count: 0 },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Update Module ──────────────────────────────────────────────────────────
export async function updateModuleAction(
  payload: UpdateModulePayload
): Promise<ApiResponse<ModuleWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { id, ...updates } = payload;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();

    const { data, error } = await supabase
      .from("modules")
      .update(updates)
      .eq("id", id)
      .eq("lecturer_id", session.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A module with this code already exists" };
      }
      return { success: false, message: error.message };
    }

    const { count: studentCount } = await supabase
      .from("module_students")
      .select("student_id", { count: "exact", head: true })
      .eq("module_id", id);

    const { count: lectureCount } = await supabase
      .from("lectures")
      .select("id", { count: "exact", head: true })
      .eq("module_id", id);

    return {
      success: true,
      message: "Module updated successfully",
      data: { ...data, student_count: studentCount ?? 0, lecture_count: lectureCount ?? 0 },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Delete Module ──────────────────────────────────────────────────────────
export async function deleteModuleAction(
  moduleId: string
): Promise<ApiResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId)
      .eq("lecturer_id", session.id);

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Module deleted successfully" };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Enrolled Students ──────────────────────────────────────────────────
export async function getModuleStudentsAction(
  moduleId: string
): Promise<ApiResponse<Student[]>> {
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

    const { data: enrollments, error } = await supabase
      .from("module_students")
      .select("student_id")
      .eq("module_id", moduleId);

    if (error) return { success: false, message: error.message };

    const studentIds = (enrollments ?? []).map((e: { student_id: string }) => e.student_id);
    if (studentIds.length === 0) return { success: true, message: "No students", data: [] };

    const { data: students, error: stuErr } = await supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .in("id", studentIds)
      .order("name");

    if (stuErr) return { success: false, message: stuErr.message };

    return { success: true, message: "Students fetched", data: students ?? [] };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Available Students (not in module) ─────────────────────────────────
export async function getAvailableStudentsAction(
  moduleId: string
): Promise<ApiResponse<Student[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Get already enrolled student IDs
    const { data: enrolled } = await supabase
      .from("module_students")
      .select("student_id")
      .eq("module_id", moduleId);

    const enrolledIds = (enrolled ?? []).map((e: { student_id: string }) => e.student_id);

    // Get all active students
    let query = supabase
      .from("users")
      .select("id, name, email, rfid, index_number, degree, batch, is_active")
      .eq("role", "student")
      .eq("is_active", true)
      .order("name");

    if (enrolledIds.length > 0) {
      // Filter out already enrolled students — use NOT IN via filter
      query = query.not("id", "in", `(${enrolledIds.join(",")})`);
    }

    const { data: students, error } = await query;

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Available students fetched", data: students ?? [] };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Enroll Students ────────────────────────────────────────────────────────
export async function enrollStudentsAction(
  payload: EnrollStudentsPayload
): Promise<ApiResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const rows = payload.student_ids.map((student_id) => ({
      module_id: payload.module_id,
      student_id,
    }));

    const { error } = await supabase.from("module_students").insert(rows);

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `${payload.student_ids.length} student(s) enrolled successfully`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Unenroll Students ──────────────────────────────────────────────────────
export async function unenrollStudentsAction(
  payload: UnenrollStudentsPayload
): Promise<ApiResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
      .from("module_students")
      .delete()
      .eq("module_id", payload.module_id)
      .in("student_id", payload.student_ids);

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `${payload.student_ids.length} student(s) removed successfully`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
