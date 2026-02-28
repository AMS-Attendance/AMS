import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyEsp32Key } from "@/lib/auth/esp32";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/students/all
 * Full download endpoint for ESP32 devices.
 * Returns ALL active students with RFID assigned.
 * Auth: X-ESP32-Key header.
 */
export async function GET(req: NextRequest) {
  const authError = verifyEsp32Key(req);
  if (authError) return authError;
  try {
    console.log("Full student download request received");

    const { data: students, error } = await supabase
      .from("users")
      .select("rfid, name, index_number, batch, degree, updated_at")
      .eq("role", "student")
      .eq("is_active", true)
      .not("rfid", "is", null)
      .order("updated_at", { ascending: true })
      .limit(10000);

    if (error) {
      console.error("Supabase fetch all error:", error);
      return NextResponse.json(
        { success: false, message: "Fetch failed", error: error.message },
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
