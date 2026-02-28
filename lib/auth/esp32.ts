import { NextRequest, NextResponse } from "next/server";

/**
 * Shared secret key for ESP32 ↔ Next.js API authentication.
 * Set ESP32_API_KEY in .env to match the value in ESP32/Config.h
 */
const ESP32_API_KEY =
  process.env.ESP32_API_KEY ?? "esp32-ams-secret-key-2024";

/**
 * Verify that the incoming request has a valid ESP32 API key.
 * Returns null if valid, or a NextResponse 401 if invalid.
 *
 * Usage in route handlers:
 * ```ts
 * const authError = verifyEsp32Key(req);
 * if (authError) return authError;
 * ```
 */
export function verifyEsp32Key(
  req: NextRequest,
): NextResponse | null {
  const apiKey = req.headers.get("x-esp32-key");
  if (apiKey === ESP32_API_KEY) return null;

  console.warn(
    `[ESP32 Auth] Invalid key from ${req.headers.get("x-forwarded-for") ?? "unknown"}`,
  );

  return NextResponse.json(
    { success: false, message: "Unauthorized: invalid ESP32 API key" },
    { status: 401 },
  );
}
