import type { User } from "./auth";

// ─── Enums ───────────────────────────────────────────────
export type LectureType = "Lecture" | "Lab" | "Tutorial" | "Seminar";
export type LectureStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type AttendanceMethod = "manual" | "rfid";

// ─── Module ──────────────────────────────────────────────
export interface Module {
  id: string;
  code: string;
  name: string;
  lecturer_id: string;
  credits: number | null;
  semester: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleWithStats extends Module {
  student_count: number;
  lecture_count: number;
}

export interface CreateModulePayload {
  code: string;
  name: string;
  credits?: number;
  semester?: number;
  description?: string;
}

export interface UpdateModulePayload extends Partial<CreateModulePayload> {
  id: string;
  is_active?: boolean;
}

// ─── Lecture ─────────────────────────────────────────────
export interface Lecture {
  id: string;
  module_id: string;
  title: string;
  scheduled_at: string;
  duration_hours: string; // Postgres INTERVAL returned as string
  location: string | null;
  type: LectureType;
  description: string | null;
  status: LectureStatus;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LectureWithModule extends Lecture {
  module_code: string;
  module_name: string;
}

export interface LectureWithStats extends Lecture {
  module_code: string;
  module_name: string;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}

export interface CreateLecturePayload {
  module_id: string;
  title: string;
  scheduled_at: string;
  duration_hours?: string;
  location?: string;
  type?: LectureType;
  description?: string;
}

export interface UpdateLecturePayload extends Partial<CreateLecturePayload> {
  id: string;
  status?: LectureStatus;
}

// ─── Attendance ──────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  lecture_id: string;
  student_id: string;
  timestamp: string;
  status: AttendanceStatus;
  marked_by: string | null;
  method: AttendanceMethod;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student_name: string;
  student_email: string;
  index_number: string | null;
  rfid: string | null;
}

export interface MarkAttendancePayload {
  lecture_id: string;
  student_id: string;
  status?: AttendanceStatus;
  method?: AttendanceMethod;
  remarks?: string;
}

// ─── Student (joined view) ──────────────────────────────
export interface Student extends Pick<User, "id" | "name" | "email" | "rfid" | "index_number" | "degree" | "batch" | "is_active"> {}

export interface StudentWithAttendance extends Student {
  total_lectures: number;
  attended_lectures: number;
  attendance_percentage: number;
}

// ─── Module Students ────────────────────────────────────
export interface ModuleStudent {
  module_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface EnrollStudentsPayload {
  module_id: string;
  student_ids: string[];
}

export interface UnenrollStudentsPayload {
  module_id: string;
  student_ids: string[];
}

// ─── Dashboard Overview ─────────────────────────────────
export interface DashboardStats {
  total_modules: number;
  total_lectures: number;
  total_students: number;
  upcoming_lectures: number;
  completed_lectures: number;
  overall_attendance_rate: number;
}

export interface RecentLecture {
  id: string;
  title: string;
  module_code: string;
  module_name: string;
  scheduled_at: string;
  status: LectureStatus;
  present_count: number;
  total_students: number;
}

export interface ModuleAttendanceSummary {
  module_id: string;
  module_code: string;
  module_name: string;
  student_count: number;
  lecture_count: number;
  avg_attendance_rate: number;
}

// ─── SSE Events ─────────────────────────────────────────
export interface SSEAttendanceEvent {
  type: "attendance_marked";
  data: AttendanceWithStudent;
  lecture_id: string;
  timestamp: string;
}

// ─── API Response ───────────────────────────────────────
export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}
