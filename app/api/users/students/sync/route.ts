import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyEsp32Key } from "@/lib/auth/esp32";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/students/sync?since=<ISO timestamp>
 * Incremental sync endpoint for ESP32 devices.
 * Returns students with RFID updated after the given timestamp.
 * Auth: X-ESP32-Key header.
 */
export async function GET(req: NextRequest) {
  const authError = verifyEsp32Key(req);
  if (authError) return authError;
  try {
    const since = req.nextUrl.searchParams.get("since");
    console.log("Sync request received. Since:", since);

    let query = supabase
      .from("users")
      .select("rfid, name, index_number, batch, degree, updated_at")
      .eq("role", "student")
      .eq("is_active", true)
      .not("rfid", "is", null);

    // If 'since' provided, only return students updated after that timestamp
    if (since) {
      query = query.gt("updated_at", since);
    }

    const { data: students, error } = await query
      .order("updated_at", { ascending: true })
      .limit(10000);

    if (error) {
      console.error("Supabase sync error:", error);
      return NextResponse.json(
        { success: false, message: "Sync failed", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: (students ?? []).length,
      data: (students ?? []).map((s) => ({
        rfid: s.rfid,
        name: s.name,
        index_number: s.index_number || "",
        batch: s.batch || "",
        degree: s.degree || "",
      })),
      syncTimestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: (err as Error).message },
      { status: 500 }
    );
  }
}
