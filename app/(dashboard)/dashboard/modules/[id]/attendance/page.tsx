"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModuleAttendanceReport } from "@/lib/api/client/reports";
import {
  exportModuleAttendanceExcel,
  exportModuleAttendancePDF,
} from "@/lib/export/attendance-report";
import type { ModuleAttendanceStudent } from "@/lib/api/server/reports";

// ── Attendance Rate Badge ──────────────────────────────────────────────────
function AttendanceRateBadge({ rate }: { rate: number }) {
  if (rate >= 80) {
    return (
      <Badge
        variant="outline"
        className="bg-green-500/20 text-green-400 border-green-500/30 font-mono"
      >
        {rate}%
      </Badge>
    );
  }
  if (rate >= 60) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono"
      >
        {rate}%
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-red-500/20 text-red-400 border-red-500/30 font-mono"
    >
      <AlertTriangle className="mr-1 h-3 w-3" />
      {rate}%
    </Badge>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="heading-font text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-600">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sort column types ──────────────────────────────────────────────────────
type SortKey =
  | "name"
  | "index_number"
  | "batch"
  | "present_count"
  | "absent_count"
  | "attended_count"
  | "attendance_percentage";

type SortDir = "asc" | "desc";

// ── Sort Icon ──────────────────────────────────────────────────────────────
function SortIcon({
  column,
  currentKey,
  currentDir,
}: {
  column: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
}) {
  if (currentKey !== column)
    return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-600" />;
  return currentDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3 text-blue-400" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3 text-blue-400" />
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ModuleAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const { data: report, isLoading, isError } = useModuleAttendanceReport(moduleId);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Filter & sort
  const students = useMemo(() => {
    if (!report) return [];

    let filtered = report.students;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.index_number?.toLowerCase().includes(q) ?? false) ||
          (s.degree?.toLowerCase().includes(q) ?? false)
      );
    }

    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
  }, [report, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Attendance distribution
  const distribution = useMemo(() => {
    if (!report) return { excellent: 0, good: 0, warning: 0, critical: 0 };
    return {
      excellent: report.students.filter((s) => s.attendance_percentage >= 80).length,
      good: report.students.filter(
        (s) => s.attendance_percentage >= 60 && s.attendance_percentage < 80
      ).length,
      warning: report.students.filter(
        (s) => s.attendance_percentage >= 40 && s.attendance_percentage < 60
      ).length,
      critical: report.students.filter((s) => s.attendance_percentage < 40).length,
    };
  }, [report]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-4">
                <div className="h-16 animate-pulse rounded bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-4">
            <div className="h-64 animate-pulse rounded bg-slate-800" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/modules")}
          className="text-slate-400 hover:text-white gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </Button>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-sm text-slate-400">
              Failed to load attendance report. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/modules")}
              className="text-slate-400 hover:text-white gap-2 -ml-3 mb-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </Button>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1"
              >
                {report.module_code}
              </Badge>
              <h1 className="heading-font text-2xl font-bold text-white">
                {report.module_name}
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Attendance Report • Semester {report.semester ?? "N/A"} •{" "}
              {report.credits ?? 0} Credits
            </p>
          </div>

          {/* Export Buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-slate-700 bg-slate-900">
              <DropdownMenuItem
                onClick={() => exportModuleAttendanceExcel(report)}
                className="text-white gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-400" />
                Export as Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportModuleAttendancePDF(report)}
                className="text-white gap-2"
              >
                <FileText className="h-4 w-4 text-red-400" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={report.total_students}
            icon={Users}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            title="Total Lectures"
            value={report.total_lectures}
            icon={BookOpen}
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            title="Avg Attendance"
            value={`${report.avg_attendance_rate}%`}
            subtitle={
              report.avg_attendance_rate >= 75 ? "Good standing" : "Needs attention"
            }
            icon={
              report.avg_attendance_rate >= 75 ? TrendingUp : TrendingDown
            }
            color={
              report.avg_attendance_rate >= 75
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }
          />
          <StatCard
            title="At Risk"
            value={distribution.critical + distribution.warning}
            subtitle={`< 60% attendance`}
            icon={AlertTriangle}
            color="bg-yellow-500/20 text-yellow-400"
          />
        </div>

        {/* Attendance Distribution */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 font-normal">
              Attendance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 h-3 rounded-full overflow-hidden">
              {distribution.excellent > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${(distribution.excellent / report.total_students) * 100}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {distribution.excellent} students — Excellent (≥80%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {distribution.good > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${(distribution.good / report.total_students) * 100}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {distribution.good} students — Good (60-79%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {distribution.warning > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-yellow-500 rounded-full transition-all"
                      style={{
                        width: `${(distribution.warning / report.total_students) * 100}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {distribution.warning} students — Warning (40-59%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {distribution.critical > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-red-500 rounded-full transition-all"
                      style={{
                        width: `${(distribution.critical / report.total_students) * 100}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {distribution.critical} students — Critical (&lt;40%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Excellent ({distribution.excellent})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Good ({distribution.good})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                Warning ({distribution.warning})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Critical ({distribution.critical})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, index number, or degree..."
            className="border-slate-700 bg-slate-900 pl-9 text-white"
          />
        </div>

        {/* Attendance Table */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-white">
              Student Attendance
            </CardTitle>
            <Badge
              variant="outline"
              className="text-slate-400 border-slate-700"
            >
              {students.length} students
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="w-12 text-slate-400">#</TableHead>
                      <TableHead
                        className="text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("index_number")}
                      >
                        <span className="flex items-center">
                          Index No.
                          <SortIcon column="index_number" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("name")}
                      >
                        <span className="flex items-center">
                          Student Name
                          <SortIcon column="name" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("batch")}
                      >
                        <span className="flex items-center">
                          Batch
                          <SortIcon column="batch" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-center text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("present_count")}
                      >
                        <span className="flex items-center justify-center">
                          Present
                          <SortIcon column="present_count" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-center text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("absent_count")}
                      >
                        <span className="flex items-center justify-center">
                          Absent
                          <SortIcon column="absent_count" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-center text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("attended_count")}
                      >
                        <span className="flex items-center justify-center">
                          Attended
                          <SortIcon column="attended_count" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                      <TableHead className="text-center text-slate-400">
                        Total
                      </TableHead>
                      <TableHead
                        className="text-center text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort("attendance_percentage")}
                      >
                        <span className="flex items-center justify-center">
                          Rate
                          <SortIcon column="attendance_percentage" currentKey={sortKey} currentDir={sortDir} />
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell
                          colSpan={9}
                          className="text-center py-12 text-slate-500"
                        >
                          <Users className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student, index) => (
                        <StudentRow
                          key={student.student_id}
                          student={student}
                          index={index + 1}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

// ── Student Row ────────────────────────────────────────────────────────────
function StudentRow({
  student,
  index,
}: {
  student: ModuleAttendanceStudent;
  index: number;
}) {
  const isLow = student.attendance_percentage < 60;

  return (
    <TableRow
      className={`border-slate-800 transition-colors ${
        isLow
          ? "bg-red-500/5 hover:bg-red-500/10"
          : "hover:bg-slate-800/50"
      }`}
    >
      <TableCell className="text-slate-500 text-xs">{index}</TableCell>
      <TableCell className="text-slate-300 font-mono text-sm">
        {student.index_number ?? "—"}
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium text-white">{student.name}</p>
          <p className="text-xs text-slate-500">{student.degree ?? "—"}</p>
        </div>
      </TableCell>
      <TableCell className="text-slate-400 text-sm">
        {student.batch ?? "—"}
      </TableCell>
      <TableCell className="text-center">
        <span className="text-green-400 font-medium text-sm">
          {student.present_count}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-red-400 font-medium text-sm">
          {student.absent_count}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-white font-medium text-sm">
          {student.attended_count}
        </span>
      </TableCell>
      <TableCell className="text-center text-slate-400 text-sm">
        {student.total_lectures}
      </TableCell>
      <TableCell className="text-center">
        <AttendanceRateBadge rate={student.attendance_percentage} />
      </TableCell>
    </TableRow>
  );
}
