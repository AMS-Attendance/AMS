import { NextRequest, NextResponse } from "next/server";
import { pushRfid } from "@/app/api/sse/rfid/route";
import { verifyEsp32Key } from "@/lib/auth/esp32";

export const dynamic = "force-dynamic";

/**
 * POST /api/rfid/scan
 * Body: { rfid: string }
 *
 * Called by the RFID hardware device when a card is scanned.
 * Pushes the RFID to the SSE broadcast queue.
 * Auth: X-ESP32-Key header.
 */
export async function POST(req: NextRequest) {
  const authError = verifyEsp32Key(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const rfid = body.rfid as string | undefined;

    if (!rfid || typeof rfid !== "string" || rfid.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "rfid is required" },
        { status: 400 }
      );
    }

    pushRfid(rfid.trim());

    return NextResponse.json({
      success: true,
      message: "RFID scan received",
      data: { rfid: rfid.trim() },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}
