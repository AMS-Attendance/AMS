"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  Radio,
  Power,
  Mail,
  BookOpen,
  Loader2,
  Filter,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminStudents, useToggleStudentActive } from "@/lib/api/client";
import type { AdminStudent } from "@/lib/api/server/admin";

type FilterOption = "all" | "active" | "inactive" | "rfid" | "no-rfid";

export default function AdminStudentsPage() {
  const { data: students = [], isLoading } = useAdminStudents();
  const toggleActive = useToggleStudentActive();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");

  const typedStudents = students as AdminStudent[];

  const filtered = useMemo(() => {
    let list = typedStudents;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: AdminStudent) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.index_number?.toLowerCase().includes(q) ||
          s.degree?.toLowerCase().includes(q)
      );
    }

    // Filter
    switch (filter) {
      case "active":
        list = list.filter((s: AdminStudent) => s.is_active);
        break;
      case "inactive":
        list = list.filter((s: AdminStudent) => !s.is_active);
        break;
      case "rfid":
        list = list.filter((s: AdminStudent) => s.rfid);
        break;
      case "no-rfid":
        list = list.filter((s: AdminStudent) => !s.rfid);
        break;
    }

    return list;
  }, [typedStudents, search, filter]);

  const stats = useMemo(() => ({
    total: typedStudents.length,
    active: typedStudents.filter((s: AdminStudent) => s.is_active).length,
    withRfid: typedStudents.filter((s: AdminStudent) => s.rfid).length,
  }), [typedStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-red-400" />
          Manage Students
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {stats.total} total &middot; {stats.active} active &middot; {stats.withRfid} with RFID
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Radio className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.withRfid}</p>
              <p className="text-xs text-slate-400">RFID Registered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2.5">
              <Power className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total - stats.active}</p>
              <p className="text-xs text-slate-400">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search name, email, index, degree..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-700 bg-slate-900 text-white"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-[180px] border-slate-700 bg-slate-900 text-white">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="border-slate-800 bg-slate-950 text-white">
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="rfid">Has RFID</SelectItem>
            <SelectItem value="no-rfid">No RFID</SelectItem>
          </SelectContent>
        </Select>
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
              <GraduationCap className="h-10 w-10 mb-2" />
              <p className="text-sm">
                {search || filter !== "all" ? "No students match your filters" : "No students yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Student</TableHead>
                  <TableHead className="text-slate-400">Index No.</TableHead>
                  <TableHead className="text-slate-400">Degree / Batch</TableHead>
                  <TableHead className="text-slate-400">RFID</TableHead>
                  <TableHead className="text-slate-400">Modules</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((stu: AdminStudent) => (
                  <TableRow key={stu.id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-xs font-bold text-white flex-shrink-0">
                          {stu.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{stu.name}</p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {stu.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        {stu.index_number ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      <div>
                        {stu.degree ?? "—"}
                        {stu.batch && (
                          <span className="text-slate-500 ml-1">({stu.batch})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {stu.rfid ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs gap-1">
                          <Radio className="h-3 w-3" />
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-700 text-slate-500 text-xs">
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                        {stu.module_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          stu.is_active
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            : "border-red-500/30 text-red-400 bg-red-500/10"
                        }
                      >
                        {stu.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          stu.is_active
                            ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                            : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        }
                        disabled={toggleActive.isPending}
                        onClick={() =>
                          toggleActive.mutate({
                            id: stu.id,
                            isActive: !stu.is_active,
                          })
                        }
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {stu.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Result count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-600">
          Showing {filtered.length} of {typedStudents.length} students
        </p>
      )}
    </div>
  );
}
