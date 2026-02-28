import * as yup from "yup";

export const lectureSchema = yup.object({
  module_id: yup.string().required("Module is required").uuid("Invalid module"),
  title: yup
    .string()
    .required("Title is required")
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title must be at most 255 characters")
    .trim(),
  scheduled_at: yup
    .string()
    .required("Schedule date/time is required"),
  duration_hours: yup
    .string()
    .default("2 hours"),
  location: yup
    .string()
    .nullable()
    .max(255, "Location is too long")
    .trim(),
  type: yup
    .string()
    .oneOf(["LECTURE", "LAB", "TUTORIAL", "SEMINAR"] as const)
    .default("LECTURE"),
  description: yup.string().nullable().max(1000, "Description is too long"),
});

export type LectureFormData = yup.InferType<typeof lectureSchema>;
