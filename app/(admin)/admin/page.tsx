"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Activity,
  Radio,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  BookMarked,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminStats, useAdminRecentActivity, useAdminLecturers, useAdminModules } from "@/lib/api/client";
import type { AdminLecturer, AdminRecentActivity } from "@/lib/types";
import type { AdminModule } from "@/lib/api/server/admin";

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  };

  const c = colorMap[color] ?? colorMap.blue;

  return (
    <Card className={`border ${c.border} bg-slate-900/50 backdrop-blur-sm`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${c.bg}`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Activity Item ──────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: { id: string; type: string; description: string; timestamp: string } }) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    lecture: { icon: BookMarked, color: "text-blue-400 bg-blue-500/10" },
    student: { icon: GraduationCap, color: "text-emerald-400 bg-emerald-500/10" },
    attendance: { icon: UserCheck, color: "text-purple-400 bg-purple-500/10" },
  };

  const config = typeConfig[activity.type] ?? typeConfig.lecture;
  const Icon = config.icon;

  const timeAgo = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - new Date(activity.timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [activity.timestamp]);

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-slate-800/40">
      <div className={`mt-0.5 rounded-md p-1.5 ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 leading-snug truncate">
          {activity.description}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">{timeAgo}</p>
      </div>
    </div>
  );
}

// ── Quick View Table ───────────────────────────────────────────────────────
function QuickLecturersTable() {
  const { data: lecturers = [] } = useAdminLecturers();
  const topLecturers = (lecturers as AdminLecturer[]).slice(0, 5);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-white">
          Recent Lecturers
        </CardTitle>
        <Link href="/admin/lecturers">
          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {topLecturers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No lecturers yet</p>
        ) : (
          <div className="space-y-2">
            {topLecturers.map((lec: AdminLecturer) => (
              <div key={lec.id} className="flex items-center justify-between rounded-lg p-2.5 bg-slate-800/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white flex-shrink-0">
                    {lec.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lec.name}</p>
                    <p className="text-xs text-slate-500 truncate">{lec.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                    {lec.module_count} modules
                  </Badge>
                  <div className={`h-2 w-2 rounded-full ${lec.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickModulesTable() {
  const { data: modules = [] } = useAdminModules();
  const topModules = (modules as AdminModule[]).slice(0, 5);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-white">
          Recent Modules
        </CardTitle>
        <Link href="/admin/modules">
          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {topModules.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No modules yet</p>
        ) : (
          <div className="space-y-2">
            {topModules.map((mod: AdminModule) => (
              <div key={mod.id} className="flex items-center justify-between rounded-lg p-2.5 bg-slate-800/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                      {mod.code}
                    </Badge>
                    <p className="text-sm font-medium text-white truncate">{mod.name}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">by {mod.lecturer_name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
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

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: activity = [] as AdminRecentActivity[], isLoading: activityLoading } = useAdminRecentActivity();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-red-400" />
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5">
                <div className="h-16 animate-pulse rounded bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Lecturers"
            value={stats.total_lecturers}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Total Students"
            value={stats.total_students}
            icon={GraduationCap}
            color="green"
            subtitle={`${stats.active_students} active`}
          />
          <StatCard
            label="Active Modules"
            value={stats.total_modules}
            icon={BookOpen}
            color="purple"
          />
          <StatCard
            label="Total Lectures"
            value={stats.total_lectures}
            icon={CalendarDays}
            color="orange"
          />
          <StatCard
            label="Lectures Today"
            value={stats.lectures_today}
            icon={Clock}
            color="cyan"
          />
          <StatCard
            label="RFID Registered"
            value={stats.students_with_rfid}
            icon={Radio}
            color="pink"
            subtitle={`of ${stats.active_students} active students`}
          />
          <StatCard
            label="Attendance Rate"
            value={`${stats.overall_attendance_rate}%`}
            icon={TrendingUp}
            color="yellow"
          />
          <StatCard
            label="System Health"
            value="Online"
            icon={Activity}
            color="green"
            subtitle="All services running"
          />
        </div>
      ) : null}

      {/* Activity + Quick Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
              <Activity className="h-4 w-4 text-red-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-1">
                {(activity as AdminRecentActivity[]).map((a: AdminRecentActivity) => (
                  <ActivityItem key={a.id} activity={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tables */}
        <div className="space-y-6 lg:col-span-2">
          <QuickLecturersTable />
          <QuickModulesTable />
        </div>
      </div>
    </div>
  );
}
