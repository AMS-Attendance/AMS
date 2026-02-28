import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ams.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";

/**
 * GET /api/admin/seed
 * Ensures the default admin account exists.
 * Called automatically on app startup via instrumentation.
 * Idempotent — safe to call multiple times.
 */
export async function GET() {
  try {
    // Check if admin already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", ADMIN_EMAIL)
      .eq("role", "admin")
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Admin account already exists",
        created: false,
      });
    }

    // Hash password and create admin
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const { data: admin, error } = await supabase
      .from("users")
      .insert({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        is_active: true,
      })
      .select("id, email")
      .single();

    if (error) {
      console.error("[Admin Seed] Failed to create admin:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    console.log(`[Admin Seed] Admin account created: ${admin.email}`);
    return NextResponse.json({
      success: true,
      message: "Admin account created",
      created: true,
    });
  } catch (err) {
    console.error("[Admin Seed] Error:", err);
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}
