export type UserRole = "admin" | "lecturer" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rfid: string | null;
  index_number: string | null;
  degree: string | null;
  batch: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  index_number?: string;
  degree?: string;
  batch?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, "created_at" | "updated_at">;
}

export interface SessionUser {
  id: string;
  role: UserRole;
}
