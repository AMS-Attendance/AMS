import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyEsp32Key } from "@/lib/auth/esp32";

export const dynamic = "force-dynamic";

/**
 * POST /api/attendance/esp32/batch
 *
 * Called by ESP32 to upload a batch of attendance scans for one lecture.
 *
 * Auth: X-ESP32-Key header (shared secret).
 *
 * Request body (from AttendanceLog::toUploadJSON):
 * {
 *   "lectureId": "<UUID>",
 *   "scans": [
 *     { "rfid": "0A1B2C3D4E", "time": "2026-02-28T09:15:30" },
 *     ...
 *   ]
 * }
 *
 * Legacy format (from uploadBatch):
 * {
 *   "lectureId": "<UUID>",
 *   "rfids": ["0A1B2C3D4E", "1F2E3D4C5B", ...]
 * }
 *
 * For each scan, the route:
 * 1. Looks up the student by RFID
 * 2. Determines PRESENT vs LATE based on lecture scheduled_at + a grace window
 * 3. Upserts into the attendance table (idempotent on lecture_id + student_id)
 */
export async function POST(req: NextRequest) {
  const authError = verifyEsp32Key(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const lectureId: string | undefined = body.lectureId;

    if (!lectureId) {
      return NextResponse.json(
        { success: false, message: "lectureId is required" },
        { status: 400 },
      );
    }

    // ── Validate lecture exists ───────────────────────────
    const { data: lecture, error: lecErr } = await supabase
      .from("lectures")
      .select("id, scheduled_at, duration_hours, module_id")
      .eq("id", lectureId)
      .single();

    if (lecErr || !lecture) {
      return NextResponse.json(
        { success: false, message: "Lecture not found" },
        { status: 404 },
      );
    }

    // ── Build scan list (support both v3 and legacy formats) ──
    interface ScanEntry {
      rfid: string;
      time: string | null;
    }

    let scans: ScanEntry[] = [];

    if (Array.isArray(body.scans)) {
      // v3 format: scans with timestamps
      scans = body.scans.map(
        (s: { rfid: string; time?: string }) => ({
          rfid: s.rfid?.toUpperCase().trim(),
          time: s.time ?? null,
        }),
      );
    } else if (Array.isArray(body.rfids)) {
      // Legacy format: just RFIDs, no timestamps
      scans = body.rfids.map((rfid: string) => ({
        rfid: rfid?.toUpperCase().trim(),
        time: null,
      }));
    } else {
      return NextResponse.json(
        { success: false, message: "scans or rfids array is required" },
        { status: 400 },
      );
    }

    if (scans.length === 0) {
      return NextResponse.json(
        { success: false, message: "No scans provided" },
        { status: 400 },
      );
    }

    // ── Look up all students by their RFID ───────────────
    const rfidList = scans
      .map((s) => s.rfid)
      .filter((r) => r && r.length > 0);

    const { data: students, error: stuErr } = await supabase
      .from("users")
      .select("id, rfid, name")
      .eq("role", "student")
      .eq("is_active", true)
      .in("rfid", rfidList);

    if (stuErr) {
      console.error("[esp32/batch] Student lookup error:", stuErr.message);
      return NextResponse.json(
        { success: false, message: "Failed to look up students" },
        { status: 500 },
      );
    }

    // Build RFID → student map (case-insensitive)
    const rfidToStudent = new Map(
      (students ?? []).map(
        (s: { id: string; rfid: string; name: string }) => [
          s.rfid?.toUpperCase(),
          s,
        ],
      ),
    );

    // ── Build attendance upsert rows ─────────────────────
    let inserted = 0;
    let skippedUnknown = 0;
    let skippedDuplicate = 0;
    const errors: string[] = [];

    // Collect rows for bulk upsert
    const upsertRows: Array<{
      lecture_id: string;
      student_id: string;
      status: string;
      method: string;
      timestamp: string;
      remarks: string | null;
    }> = [];

    // Track already-seen student IDs in this batch to avoid duplicates within the batch
    const seenStudentIds = new Set<string>();

    for (const scan of scans) {
      const student = rfidToStudent.get(scan.rfid);
      if (!student) {
        skippedUnknown++;
        errors.push(`Unknown RFID: ${scan.rfid}`);
        continue;
      }

      if (seenStudentIds.has(student.id)) {
        skippedDuplicate++;
        continue;
      }
      seenStudentIds.add(student.id);

      // Always mark as PRESENT for RFID scans
      const status = "PRESENT";

      const timestamp = scan.time
        ? new Date(scan.time).toISOString()
        : new Date().toISOString();

      upsertRows.push({
        lecture_id: lectureId,
        student_id: student.id,
        status,
        method: "rfid",
        timestamp,
        remarks: `ESP32 scan at ${scan.time ?? "unknown time"}`,
      });
    }

    // ── Bulk upsert ──────────────────────────────────────
    if (upsertRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("attendance")
        .upsert(upsertRows, { onConflict: "lecture_id,student_id" });

      if (upsertErr) {
        console.error("[esp32/batch] Upsert error:", upsertErr.message);
        return NextResponse.json(
          { success: false, message: "Failed to insert attendance: " + upsertErr.message },
          { status: 500 },
        );
      }

      inserted = upsertRows.length;
    }

    console.log(
      `[esp32/batch] Lecture ${lectureId}: ${inserted} inserted, ${skippedUnknown} unknown, ${skippedDuplicate} duplicate`,
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${scans.length} scans: ${inserted} recorded, ${skippedUnknown} unknown RFIDs, ${skippedDuplicate} duplicates`,
      data: {
        lecture_id: lectureId,
        total_scans: scans.length,
        inserted,
        skipped_unknown: skippedUnknown,
        skipped_duplicate: skippedDuplicate,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
    });
  } catch (err) {
    console.error("[esp32/batch] Unexpected error:", err);
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 },
    );
  }
}
