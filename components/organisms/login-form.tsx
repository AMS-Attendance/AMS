"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField, PasswordInput, AuthDivider } from "@/components/atoms";
import { useLogin } from "@/lib/api/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import * as yup from "yup";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();

  const [form, setForm] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    try {
      await loginSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        err.inner.forEach((e) => {
          if (e.path) fieldErrors[e.path as keyof LoginFormData] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    login.mutate(form, {
      onSuccess: (data) => {
        if (data.success) {
          if (data.user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          setServerError(data.message);
        }
      },
      onError: () => {
        setServerError("Something went wrong. Please try again.");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {serverError}
        </div>
      )}

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

      <PasswordInput
        label="Password"
        name="password"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label
            htmlFor="remember"
            className="text-sm text-slate-400 cursor-pointer"
          >
            Remember me
          </Label>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={login.isPending}
        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] group"
      >
        {login.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight
              size={16}
              className="ml-2 group-hover:translate-x-1 transition-transform"
            />
          </>
        )}
      </Button>

      <AuthDivider />

      <p className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
