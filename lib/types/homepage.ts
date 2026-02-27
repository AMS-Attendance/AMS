import { LucideIcon } from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent?: "blue" | "cyan" | "violet" | "emerald" | "amber" | "rose";
  delay?: number;
};

export type Step = {
  num: number;
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type Stat = {
  value: number;
  suffix?: string;
  label: string;
};