"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  CalendarDays,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminModules } from "@/lib/api/client";
import type { AdminModule } from "@/lib/api/server/admin";

export default function AdminModulesPage() {
  const { data: modules = [], isLoading } = useAdminModules();
  const [search, setSearch] = useState("");

  const typedModules = modules as AdminModule[];

  const filtered = useMemo(() => {
    if (!search) return typedModules;
    const q = search.toLowerCase();
    return typedModules.filter(
      (m: AdminModule) =>
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.lecturer_name.toLowerCase().includes(q)
    );
  }, [typedModules, search]);

  const stats = useMemo(() => ({
    total: typedModules.length,
    active: typedModules.filter((m: AdminModule) => m.is_active).length,
    totalStudents: typedModules.reduce((sum: number, m: AdminModule) => sum + m.student_count, 0),
    totalLectures: typedModules.reduce((sum: number, m: AdminModule) => sum + m.lecture_count, 0),
  }), [typedModules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-red-400" />
          All Modules
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Overview of all modules across all lecturers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <GraduationCap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
              <p className="text-xs text-slate-400">Enrolled Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2.5">
              <CalendarDays className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalLectures}</p>
              <p className="text-xs text-slate-400">Total Lectures</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search by code, name, or lecturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-slate-700 bg-slate-900 text-white"
        />
      </div>

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-red-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <BookOpen className="h-10 w-10 mb-2" />
              <p className="text-sm">
                {search ? "No modules match your search" : "No modules yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Code</TableHead>
                  <TableHead className="text-slate-400">Module Name</TableHead>
                  <TableHead className="text-slate-400">Lecturer</TableHead>
                  <TableHead className="text-slate-400">Credits</TableHead>
                  <TableHead className="text-slate-400">Semester</TableHead>
                  <TableHead className="text-slate-400">Students</TableHead>
                  <TableHead className="text-slate-400">Lectures</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((mod: AdminModule) => (
                  <TableRow key={mod.id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs font-mono">
                        {mod.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {mod.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-bold text-white flex-shrink-0">
                          {mod.lecturer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-300 truncate">{mod.lecturer_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {mod.credits ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {mod.semester ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                        {mod.student_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                        {mod.lecture_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          mod.is_active
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            : "border-red-500/30 text-red-400 bg-red-500/10"
                        }
                      >
                        {mod.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-600">
          Showing {filtered.length} of {typedModules.length} modules
        </p>
      )}
    </div>
  );
}
