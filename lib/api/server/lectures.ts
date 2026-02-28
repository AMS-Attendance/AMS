"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth/jwt";
import type {
  ApiResponse,
  LectureWithStats,
  CreateLecturePayload,
  UpdateLecturePayload,
} from "@/lib/types";

// ── Get Lectures for Lecturer ──────────────────────────────────────────────
export async function getLecturesAction(
  moduleId?: string,
): Promise<ApiResponse<LectureWithStats[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Get lecturer's modules
    let moduleQuery = supabase
      .from("modules")
      .select("id, code, name")
      .eq("lecturer_id", session.id)
      .eq("is_active", true);

    if (moduleId) {
      moduleQuery = moduleQuery.eq("id", moduleId);
    }

    const { data: modules, error: modErr } = await moduleQuery;
    if (modErr) return { success: false, message: modErr.message };

    const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
    if (moduleIds.length === 0)
      return { success: true, message: "No modules", data: [] };

    const moduleMap = new Map(
      (modules ?? []).map((m: { id: string; code: string; name: string }) => [
        m.id,
        m,
      ]),
    );

    const { data: lectures, error } = await supabase
      .from("lectures")
      .select("*")
      .in("module_id", moduleIds)
      .order("scheduled_at", { ascending: false });

    if (error) return { success: false, message: error.message };

    const result: LectureWithStats[] = [];

    for (const lec of lectures ?? []) {
      const mod = moduleMap.get(lec.module_id) as
        | { code: string; name: string }
        | undefined;

      const { count: totalStudents } = await supabase
        .from("module_students")
        .select("student_id", { count: "exact", head: true })
        .eq("module_id", lec.module_id);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("lecture_id", lec.id)
        .eq("status", "PRESENT");

      const { count: absentCount } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("lecture_id", lec.id)
        .eq("status", "ABSENT");

      result.push({
        ...lec,
        module_code: mod?.code ?? "",
        module_name: mod?.name ?? "",
        total_students: totalStudents ?? 0,
        present_count: presentCount ?? 0,
        absent_count: absentCount ?? 0,
      });
    }

    return { success: true, message: "Lectures fetched", data: result };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Get Single Lecture ─────────────────────────────────────────────────────
export async function getLectureByIdAction(
  lectureId: string,
): Promise<ApiResponse<LectureWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { data: lec, error } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .single();

    if (error || !lec) return { success: false, message: "Lecture not found" };

    // Verify ownership via module
    const { data: mod } = await supabase
      .from("modules")
      .select("id, code, name")
      .eq("id", lec.module_id)
      .eq("lecturer_id", session.id)
      .single();

    if (!mod) return { success: false, message: "Unauthorized" };

    const { count: totalStudents } = await supabase
      .from("module_students")
      .select("student_id", { count: "exact", head: true })
      .eq("module_id", lec.module_id);

    const { count: presentCount } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("lecture_id", lec.id)
      .eq("status", "PRESENT");

    const { count: absentCount } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("lecture_id", lec.id)
      .eq("status", "ABSENT");

    return {
      success: true,
      message: "Lecture fetched",
      data: {
        ...lec,
        module_code: mod.code,
        module_name: mod.name,
        total_students: totalStudents ?? 0,
        present_count: presentCount ?? 0,
        absent_count: absentCount ?? 0,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Create Lecture ─────────────────────────────────────────────────────────
export async function createLectureAction(
  payload: CreateLecturePayload,
): Promise<ApiResponse<LectureWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    // Verify module belongs to lecturer
    const { data: mod } = await supabase
      .from("modules")
      .select("id, code, name")
      .eq("id", payload.module_id)
      .eq("lecturer_id", session.id)
      .single();

    if (!mod) return { success: false, message: "Module not found" };

    // Build insert data, only including defined fields so Postgres defaults apply
    const insertData: Record<string, unknown> = {
      module_id: payload.module_id,
      title: payload.title,
      scheduled_at: payload.scheduled_at,
    };
    if (payload.type !== undefined)
      insertData.type = payload.type.toUpperCase();
    if (payload.duration_hours !== undefined)
      insertData.duration_hours = payload.duration_hours;
    if (payload.location !== undefined) insertData.location = payload.location;
    if (payload.description !== undefined)
      insertData.description = payload.description;

    const { data, error } = await supabase
      .from("lectures")
      .insert(insertData)
      .select()
      .single();

    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: "Lecture created successfully",
      data: {
        ...data,
        module_code: mod.code,
        module_name: mod.name,
        total_students: 0,
        present_count: 0,
        absent_count: 0,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Update Lecture ─────────────────────────────────────────────────────────
export async function updateLectureAction(
  payload: UpdateLecturePayload,
): Promise<ApiResponse<LectureWithStats>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const { id, ...rawUpdates } = payload;

    // Ensure type is uppercase for DB CHECK constraint
    const updates = { ...rawUpdates };
    if (updates.type) {
      updates.type = updates.type.toUpperCase() as typeof updates.type;
    }

    // Get current lecture to verify ownership
    const { data: existing } = await supabase
      .from("lectures")
      .select("module_id")
      .eq("id", id)
      .single();

    if (!existing) return { success: false, message: "Lecture not found" };

    const { data: mod } = await supabase
      .from("modules")
      .select("id, code, name")
      .eq("id", existing.module_id)
      .eq("lecturer_id", session.id)
      .single();

    if (!mod) return { success: false, message: "Unauthorized" };

    const { data, error } = await supabase
      .from("lectures")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, message: error.message };

    const { count: totalStudents } = await supabase
      .from("module_students")
      .select("student_id", { count: "exact", head: true })
      .eq("module_id", data.module_id);

    const { count: presentCount } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("lecture_id", id)
      .eq("status", "PRESENT");

    const { count: absentCount } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("lecture_id", id)
      .eq("status", "ABSENT");

    return {
      success: true,
      message: "Lecture updated successfully",
      data: {
        ...data,
        module_code: mod.code,
        module_name: mod.name,
        total_students: totalStudents ?? 0,
        present_count: presentCount ?? 0,
        absent_count: absentCount ?? 0,
      },
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

// ── Delete Lecture ─────────────────────────────────────────────────────────
export async function deleteLectureAction(
  lectureId: string,
): Promise<ApiResponse> {
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

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lectureId);

    if (error) return { success: false, message: error.message };

    return { success: true, message: "Lecture deleted successfully" };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
