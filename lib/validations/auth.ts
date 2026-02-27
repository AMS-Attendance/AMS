import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export const signupSchema = yup.object({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .required("Full name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: yup
    .string()
    .oneOf(["student", "lecturer", "admin"] as const, "Invalid role")
    .required("Role is required"),
  index_number: yup.string().when("role", {
    is: "student",
    then: (schema) => schema.required("Index number is required for students"),
    otherwise: (schema) => schema.optional(),
  }),
  degree: yup.string().when("role", {
    is: "student",
    then: (schema) => schema.required("Degree programme is required for students"),
    otherwise: (schema) => schema.optional(),
  }),
  batch: yup.string().when("role", {
    is: "student",
    then: (schema) => schema.required("Batch is required for students"),
    otherwise: (schema) => schema.optional(),
  }),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type SignupFormData = yup.InferType<typeof signupSchema>;
