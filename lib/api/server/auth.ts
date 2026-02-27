"use server";

import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { generateToken, setAuthCookie, removeAuthCookie, getSession } from "@/lib/auth/jwt";
import type { AuthResponse, LoginPayload, SignupPayload, User } from "@/lib/types";

// ── Login ──────────────────────────────────────────────────────────────────
export async function loginAction(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { email, password } = payload;

    // Fetch user with password hash
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, password, rfid, index_number, degree, batch, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return { success: false, message: "Invalid email or password" };
    }

    if (!user.is_active) {
      return { success: false, message: "Your account has been deactivated. Contact an administrator." };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Generate JWT & set cookie
    const token = await generateToken(user.id, user.role);
    await setAuthCookie(token);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    return {
      success: true,
      message: "Login successful",
      user: safeUser,
    };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

// ── Signup ─────────────────────────────────────────────────────────────────
export async function signupAction(payload: SignupPayload): Promise<AuthResponse> {
  try {
    const { name, email, password, role, index_number, degree, batch } = payload;

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return { success: false, message: "An account with this email already exists" };
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        index_number: index_number?.trim() || null,
        degree: degree?.trim() || null,
        batch: batch?.trim() || null,
        is_active: true,
      })
      .select("id, name, email, role, rfid, index_number, degree, batch, is_active")
      .single();

    if (error || !newUser) {
      console.error("Signup DB error:", error);
      return { success: false, message: "Failed to create account. Please try again." };
    }

    // Generate JWT & set cookie
    const token = await generateToken(newUser.id, newUser.role);
    await setAuthCookie(token);

    return {
      success: true,
      message: "Account created successfully",
      user: newUser,
    };
  } catch (err) {
    console.error("Signup error:", err);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

// ── Logout ─────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<AuthResponse> {
  await removeAuthCookie();
  return { success: true, message: "Logged out successfully" };
}

// ── Get current user ───────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, rfid, index_number, degree, batch, is_active, created_at, updated_at")
    .eq("id", session.id)
    .single();

  if (error || !user || !user.is_active) return null;
  return user as User;
}
