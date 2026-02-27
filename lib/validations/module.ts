import * as yup from "yup";

export const moduleSchema = yup.object({
  code: yup
    .string()
    .required("Module code is required")
    .matches(/^[A-Z]{2,5}\d{3,5}$/, "Code format: e.g. CS3042, IT4010")
    .trim(),
  name: yup
    .string()
    .required("Module name is required")
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must be at most 255 characters")
    .trim(),
  credits: yup
    .number()
    .nullable()
    .min(1, "Credits must be at least 1")
    .max(10, "Credits must be at most 10"),
  semester: yup
    .number()
    .nullable()
    .min(1, "Semester must be at least 1")
    .max(8, "Semester must be at most 8"),
  description: yup.string().nullable().max(1000, "Description is too long"),
});

export type ModuleFormData = yup.InferType<typeof moduleSchema>;
