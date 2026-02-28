"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail, Lock, User, ArrowRight, Loader2,
  GraduationCap, BookOpen, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormField, PasswordInput, AuthDivider } from "@/components/atoms";
import { useSignup } from "@/lib/api/client";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import type { UserRole } from "@/lib/types";
import * as yup from "yup";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: "student", label: "Student", icon: <GraduationCap size={16} /> },
];

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();

  const [form, setForm] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    index_number: "",
    degree: "",
    batch: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const selectRole = (role: UserRole) => {
    setForm((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    try {
      await signupSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
        err.inner.forEach((e) => {
          if (e.path) fieldErrors[e.path as keyof SignupFormData] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    const { confirmPassword: _, ...payload } = form;
    void _;

    signup.mutate(payload, {
      onSuccess: (data) => {
        if (data.success) {
          router.push("/dashboard");
        } else {
          setServerError(data.message);
        }
      },
      onError: () => {
        setServerError("Something went wrong. Please try again.");
      },
    });
  };

  const isStudent = form.role === "student";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {serverError}
        </div>
      )}

      {/* Role selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-300">I am a</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => selectRole(r.value)}
              className={`
                flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all duration-200
                ${form.role === r.value
                  ? "border-blue-500 bg-blue-500/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                }
              `}
            >
              {r.icon}
              {r.label}
            </button>
          ))}
        </div>
        {errors.role && <p className="text-xs text-rose-400">{errors.role}</p>}
      </div>

      <FormField
        label="Full Name"
        name="name"
        placeholder="John Doe"
        icon={<User size={16} />}
        value={form.name}
        onChange={handleChange}
        error={errors.name}
        autoComplete="name"
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@university.edu"
        icon={<Mail size={16} />}
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
      />

      {/* Student-specific fields */}
      {isStudent && (
        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
          <div className="text-xs text-blue-400 font-medium tracking-wide uppercase flex items-center gap-1.5">
            <GraduationCap size={12} />
            Student Details
          </div>
          <FormField
            label="Index Number"
            name="index_number"
            placeholder="CS21001"
            icon={<Hash size={16} />}
            value={form.index_number || ""}
            onChange={handleChange}
            error={errors.index_number}
          />
          <FormField
            label="Degree Programme"
            name="degree"
            placeholder="BSc (Hons) in Computer Science"
            icon={<BookOpen size={16} />}
            value={form.degree || ""}
            onChange={handleChange}
            error={errors.degree}
          />
          <FormField
            label="Batch"
            name="batch"
            placeholder="2021"
            icon={<GraduationCap size={16} />}
            value={form.batch || ""}
            onChange={handleChange}
            error={errors.batch}
          />
        </div>
      )}

      <PasswordInput
        label="Password"
        name="password"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        autoComplete="new-password"
      />

      <PasswordInput
        label="Confirm Password"
        name="confirmPassword"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      {/* Password requirements hint */}
      <div className="text-xs text-slate-500 space-y-1 pl-1">
        <p>Password must contain:</p>
        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
          <li className={form.password.length >= 8 ? "text-emerald-500" : ""}>At least 8 characters</li>
          <li className={/[A-Z]/.test(form.password) ? "text-emerald-500" : ""}>One uppercase letter</li>
          <li className={/[a-z]/.test(form.password) ? "text-emerald-500" : ""}>One lowercase letter</li>
          <li className={/[0-9]/.test(form.password) ? "text-emerald-500" : ""}>One number</li>
        </ul>
      </div>

      <Button
        type="submit"
        disabled={signup.isPending}
        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] group"
      >
        {signup.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Creating account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      <AuthDivider />

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
