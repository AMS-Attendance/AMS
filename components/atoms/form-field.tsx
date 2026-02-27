"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormField({ label, error, icon, id, className, ...props }: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <Input
          id={fieldId}
          className={`
            h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500
            focus:border-blue-500 focus:ring-blue-500/20 transition-colors
            ${icon ? "pl-10" : ""}
            ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : ""}
            ${className || ""}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-400 mt-1">{error}</p>
      )}
    </div>
  );
}
