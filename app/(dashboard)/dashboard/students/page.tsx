"use client";

import { useState } from "react";
import {
  Search,
  Users,
  Filter,
  Mail,
  CreditCard,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  useModules,
  useStudentsWithAttendance,
  useBatches,
  useDegrees,
} from "@/lib/api/client";

export default function StudentsPage() {
  const { data: modules = [] } = useModules();
  const { data: batches = [] } = useBatches();
  const { data: degrees = [] } = useDegrees();

  const [selectedModule, setSelectedModule] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterDegree, setFilterDegree] = useState<string>("all");

  const { data: students = [], isLoading } = useStudentsWithAttendance(selectedModule);

  // Apply client-side filters
  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.index_number?.toLowerCase().includes(search.toLowerCase());
    const matchBatch = filterBatch === "all" || String(s.batch) === filterBatch;
    const matchDegree = filterDegree === "all" || s.degree === filterDegree;
    return matchSearch && matchBatch && matchDegree;
  });

  // Attendance color
  const getAttendanceColor = (pct: number) => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getAttendanceBg = (pct: number) => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-font text-2xl font-bold text-white">Students</h1>
        <p className="text-sm text-slate-400">
          View student attendance across your modules
        </p>
      </div>

      {/* Module Selector */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <Label className="text-sm text-slate-300 mb-2 block">Select Module</Label>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="border-slate-700 bg-slate-900 text-white max-w-md">
              <SelectValue placeholder="Choose a module to view students..." />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900">
              {modules.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-white">
                  {m.code} — {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedModule ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <GraduationCap className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              Select a module above to view enrolled students
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="border-slate-700 bg-slate-900 pl-9 text-white"
              />
            </div>
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-[150px] border-slate-700 bg-slate-900 text-white">
                <Filter className="mr-2 h-4 w-4 text-slate-500" />
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="all" className="text-white">All Batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b} value={String(b)} className="text-white">
                    Batch {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDegree} onValueChange={setFilterDegree}>
              <SelectTrigger className="w-[180px] border-slate-700 bg-slate-900 text-white">
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="all" className="text-white">All Degrees</SelectItem>
                {degrees.map((d) => (
                  <SelectItem key={d} value={d} className="text-white">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="heading-font text-lg font-bold text-white">{filtered.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div>
                  <p className="text-xs text-slate-500">≥80%</p>
                  <p className="heading-font text-lg font-bold text-green-400">
                    {filtered.filter((s) => s.attendance_percentage >= 80).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div>
                  <p className="text-xs text-slate-500">60-79%</p>
                  <p className="heading-font text-lg font-bold text-yellow-400">
                    {filtered.filter((s) => s.attendance_percentage >= 60 && s.attendance_percentage < 80).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div>
                  <p className="text-xs text-slate-500">&lt;60%</p>
                  <p className="heading-font text-lg font-bold text-red-400">
                    {filtered.filter((s) => s.attendance_percentage < 60).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {isLoading ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-6">
                <div className="h-64 animate-pulse rounded bg-slate-800" />
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Users className="h-12 w-12 text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">No students found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Student</TableHead>
                    <TableHead className="text-slate-400">Index</TableHead>
                    <TableHead className="text-slate-400">Batch</TableHead>
                    <TableHead className="text-slate-400">Degree</TableHead>
                    <TableHead className="text-slate-400">RFID</TableHead>
                    <TableHead className="text-slate-400 text-right">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow
                      key={student.id}
                      className="border-slate-800 hover:bg-slate-800/40"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-white">{student.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {student.index_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {student.batch ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {student.degree ?? "—"}
                      </TableCell>
                      <TableCell>
                        {student.rfid ? (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CreditCard className="mr-1 h-3 w-3" />
                            Linked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-700">
                            None
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-700">
                            <div
                              className={`h-1.5 rounded-full ${getAttendanceBg(student.attendance_percentage)} transition-all`}
                              style={{ width: `${student.attendance_percentage}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${getAttendanceColor(student.attendance_percentage)}`}
                          >
                            {student.attendance_percentage}%
                          </span>
                          <span className="text-xs text-slate-500">
                            ({student.attended_lectures}/{student.total_lectures})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Label component (local tiny wrapper since we use it inline)
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
