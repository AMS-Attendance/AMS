"use client";

import {
  BookOpen,
  GraduationCap,
  Users,
  CalendarCheck,
  CalendarClock,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useDashboardStats,
  useRecentLectures,
  useModuleAttendanceSummary,
} from "@/lib/api/client";
import type { DashboardStats, RecentLecture, ModuleAttendanceSummary } from "@/lib/types";

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="heading-font text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SCHEDULED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={colors[status] ?? "text-slate-400"}>
      {status}
    </Badge>
  );
}

// ── Recent Lectures Table ──────────────────────────────────────────────────
function RecentLecturesCard({ lectures }: { lectures: RecentLecture[] }) {
  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-white">Recent Lectures</CardTitle>
        <Clock className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        {lectures.length === 0 ? (
          <p className="text-sm text-slate-500">No lectures yet</p>
        ) : (
          <div className="space-y-3">
            {lectures.map((lec) => (
              <div
                key={lec.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{lec.title}</p>
                  <p className="text-xs text-slate-500">
                    {lec.module_code} &middot;{" "}
                    {new Date(lec.scheduled_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {lec.present_count}/{lec.total_students}
                  </span>
                  <StatusBadge status={lec.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Module Summary Card ────────────────────────────────────────────────────
function ModuleSummaryCard({ modules }: { modules: ModuleAttendanceSummary[] }) {
  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-white">Module Overview</CardTitle>
        <ArrowUpRight className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <p className="text-sm text-slate-500">No modules yet</p>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.module_id}
                className="rounded-lg border border-slate-800 bg-slate-800/30 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {mod.module_code}
                    </p>
                    <p className="text-xs text-slate-500">{mod.module_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="heading-font text-lg font-bold text-white">
                      {mod.avg_attendance_rate}%
                    </p>
                    <p className="text-xs text-slate-500">attendance</p>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-700">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${mod.avg_attendance_rate}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>{mod.student_count} students</span>
                  <span>{mod.lecture_count} lectures</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-800" />
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
          <div className="h-6 w-16 animate-pulse rounded bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentLectures, isLoading: lecturesLoading } = useRecentLectures(5);
  const { data: moduleSummary, isLoading: summaryLoading } = useModuleAttendanceSummary();

  const statCards: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    accent: string;
  }[] = stats
    ? [
        { title: "Total Modules", value: stats.total_modules, icon: GraduationCap, accent: "bg-blue-600" },
        { title: "Total Lectures", value: stats.total_lectures, icon: BookOpen, accent: "bg-violet-600" },
        { title: "Total Students", value: stats.total_students, icon: Users, accent: "bg-cyan-600" },
        { title: "Upcoming", value: stats.upcoming_lectures, icon: CalendarClock, accent: "bg-yellow-600" },
        { title: "Completed", value: stats.completed_lectures, icon: CalendarCheck, accent: "bg-green-600" },
        { title: "Attendance Rate", value: `${stats.overall_attendance_rate}%`, icon: TrendingUp, accent: "bg-emerald-600" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-font text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Overview of your modules, lectures, and attendance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {lecturesLoading ? (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-6">
              <div className="h-48 animate-pulse rounded bg-slate-800" />
            </CardContent>
          </Card>
        ) : (
          <RecentLecturesCard lectures={recentLectures ?? []} />
        )}
        {summaryLoading ? (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-6">
              <div className="h-48 animate-pulse rounded bg-slate-800" />
            </CardContent>
          </Card>
        ) : (
          <ModuleSummaryCard modules={moduleSummary ?? []} />
        )}
      </div>
    </div>
  );
}
