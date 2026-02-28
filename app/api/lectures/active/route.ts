import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyEsp32Key } from "@/lib/auth/esp32";

export const dynamic = "force-dynamic";

/**
 * GET /api/lectures/active
 *
 * Called by ESP32 to fetch today's active (SCHEDULED) lectures.
 * Returns lectures whose scheduled_at falls within today and are not
 * cancelled or completed, enriched with the module code.
 *
 * Auth: X-ESP32-Key header (shared secret).
 *
 * Response shape expected by ESP32 NetworkModule::fetchActiveLectures():
 * {
 *   success: true,
 *   data: [
 *     { id: "<uuid>", code: "CS2012", time: "09:00", title: "Intro to AI" },
 *     ...
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
  const authError = verifyEsp32Key(req);
  if (authError) return authError;

  try {
    // Today's boundaries in UTC (ESP32 sends local time — adjust if needed)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch SCHEDULED lectures for today
    const { data: lectures, error } = await supabase
      .from("lectures")
      .select("id, module_id, title, scheduled_at, duration_hours, status")
      .eq("status", "SCHEDULED")
      .eq("is_cancelled", false)
      .eq("is_completed", false)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[lectures/active] Supabase error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }

    if (!lectures || lectures.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch module codes for the lectures
    const moduleIds = [...new Set(lectures.map((l) => l.module_id))];
    const { data: modules } = await supabase
      .from("modules")
      .select("id, code, name")
      .in("id", moduleIds);

    const moduleMap = new Map(
      (modules ?? []).map((m: { id: string; code: string; name: string }) => [
        m.id,
        m,
      ]),
    );

    // Shape data for ESP32 consumption
    const data = lectures.map((lec) => {
      const mod = moduleMap.get(lec.module_id) as
        | { code: string; name: string }
        | undefined;
      const scheduledDate = new Date(lec.scheduled_at);
      const time = scheduledDate.toTimeString().slice(0, 5); // "HH:MM"

      return {
        id: lec.id,
        code: mod?.code ?? "???",
        time,
        title: lec.title,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[lectures/active] Unexpected error:", err);
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 },
    );
  }
}
