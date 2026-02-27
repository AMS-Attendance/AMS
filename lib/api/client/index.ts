export { useCurrentUser, useLogin, useSignup, useLogout, authKeys } from "./auth";
export { useDashboardStats, useRecentLectures, useModuleAttendanceSummary, dashboardKeys } from "./dashboard";
export { useModules, useModuleById, useCreateModule, useUpdateModule, useDeleteModule, useModuleStudents, useAvailableStudents, useEnrollStudents, useUnenrollStudents, moduleKeys } from "./modules";
export { useLectures, useLectureById, useCreateLecture, useUpdateLecture, useDeleteLecture, lectureKeys } from "./lectures";
export { useStudents, useStudentsWithAttendance, useBatches, useDegrees, studentKeys } from "./students";
export { useLectureAttendance, useMarkAttendance, useBulkMarkAttendance, attendanceKeys } from "./attendance";
