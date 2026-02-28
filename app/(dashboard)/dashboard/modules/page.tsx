"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  UserPlus,
  UserMinus,
  Check,
  BarChart3,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useModuleStudents,
  useAvailableStudents,
  useEnrollStudents,
  useUnenrollStudents,
  useBatches,
  useDegrees,
} from "@/lib/api/client";
import type { ModuleWithStats, CreateModulePayload, Student } from "@/lib/types";

// ── Module Form Dialog ───────────────────────────────────────────────────
function ModuleFormDialog({
  open,
  onOpenChange,
  module,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: ModuleWithStats;
}) {
  const create = useCreateModule();
  const update = useUpdateModule();
  const isEditing = !!module;

  const [form, setForm] = useState({
    code: module?.code ?? "",
    name: module?.name ?? "",
    credits: module?.credits?.toString() ?? "",
    semester: module?.semester?.toString() ?? "",
    description: module?.description ?? "",
  });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!form.code.trim()) { setError("Module code is required"); return; }
    if (!form.name.trim()) { setError("Module name is required"); return; }

    const payload: CreateModulePayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      credits: form.credits ? parseInt(form.credits) : undefined,
      semester: form.semester ? parseInt(form.semester) : undefined,
      description: form.description || undefined,
    };

    if (isEditing && module) {
      update.mutate(
        { ...payload, id: module.id },
        {
          onSuccess: (res) => {
            if (res.success) onOpenChange(false);
            else setError(res.message);
          },
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: (res) => {
          if (res.success) onOpenChange(false);
          else setError(res.message);
        },
      });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="heading-font">
            {isEditing ? "Edit Module" : "New Module"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Module Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CS3042"
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Credits</Label>
              <Select
                value={form.credits}
                onValueChange={(v) => setForm({ ...form, credits: v })}
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                  <SelectValue placeholder="Credits" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)} className="text-white">
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Module Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Data Structures and Algorithms"
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Semester</Label>
            <Select
              value={form.semester}
              onValueChange={(v) => setForm({ ...form, semester: v })}
            >
              <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                {Array.from({ length: 8 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)} className="text-white">
                    Semester {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief module description..."
              className="border-slate-700 bg-slate-900 text-white resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Student Picker Dialog ────────────────────────────────────────────────
function StudentPickerDialog({
  open,
  onOpenChange,
  moduleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
}) {
  const { data: enrolledStudents = [] } = useModuleStudents(moduleId);
  const { data: availableStudents = [] } = useAvailableStudents(moduleId);
  const { data: batches = [] } = useBatches();
  const { data: degrees = [] } = useDegrees();
  const enroll = useEnrollStudents();
  const unenroll = useUnenrollStudents();

  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterDegree, setFilterDegree] = useState<string>("all");
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"enrolled" | "add">("enrolled");

  const applyFilters = (students: Student[]) =>
    students.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.index_number?.toLowerCase().includes(search.toLowerCase());
      const matchBatch = filterBatch === "all" || String(s.batch) === filterBatch;
      const matchDegree = filterDegree === "all" || s.degree === filterDegree;
      return matchSearch && matchBatch && matchDegree;
    });

  const filteredAvailable = useMemo(
    () => applyFilters(availableStudents),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableStudents, search, filterBatch, filterDegree]
  );

  const filteredEnrolled = useMemo(
    () => applyFilters(enrolledStudents),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrolledStudents, search, filterBatch, filterDegree]
  );

  const toggleAdd = (id: string) => {
    const next = new Set(selectedToAdd);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedToAdd(next);
  };

  const toggleRemove = (id: string) => {
    const next = new Set(selectedToRemove);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedToRemove(next);
  };

  // Select / deselect all currently visible students
  const handleSelectAllAdd = () => {
    const visibleIds = filteredAvailable.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedToAdd.has(id));
    if (allSelected) {
      // Deselect all visible
      const next = new Set(selectedToAdd);
      visibleIds.forEach((id) => next.delete(id));
      setSelectedToAdd(next);
    } else {
      // Select all visible
      const next = new Set(selectedToAdd);
      visibleIds.forEach((id) => next.add(id));
      setSelectedToAdd(next);
    }
  };

  const handleSelectAllRemove = () => {
    const visibleIds = filteredEnrolled.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedToRemove.has(id));
    if (allSelected) {
      const next = new Set(selectedToRemove);
      visibleIds.forEach((id) => next.delete(id));
      setSelectedToRemove(next);
    } else {
      const next = new Set(selectedToRemove);
      visibleIds.forEach((id) => next.add(id));
      setSelectedToRemove(next);
    }
  };

  const handleEnroll = () => {
    if (selectedToAdd.size === 0) return;
    enroll.mutate(
      { module_id: moduleId, student_ids: Array.from(selectedToAdd) },
      { onSuccess: () => { setSelectedToAdd(new Set()); } }
    );
  };

  const handleUnenroll = () => {
    if (selectedToRemove.size === 0) return;
    unenroll.mutate(
      { module_id: moduleId, student_ids: Array.from(selectedToRemove) },
      { onSuccess: () => { setSelectedToRemove(new Set()); } }
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterBatch("all");
    setFilterDegree("all");
  };

  const StudentRow = ({
    student,
    selected,
    onToggle,
  }: {
    student: Student;
    selected: boolean;
    onToggle: () => void;
  }) => (
    <div
      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 p-3 cursor-pointer hover:bg-slate-800/60 transition-colors"
      onClick={onToggle}
    >
      <Checkbox checked={selected} className="border-slate-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{student.name}</p>
        <p className="text-xs text-slate-500 truncate">
          {student.index_number ?? student.email}
          {student.degree && ` · ${student.degree}`}
          {student.batch && ` · Batch ${student.batch}`}
        </p>
      </div>
      {selected && <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />}
    </div>
  );

  const currentFiltered = tab === "enrolled" ? filteredEnrolled : filteredAvailable;
  const currentSelected = tab === "enrolled" ? selectedToRemove : selectedToAdd;
  const allVisibleSelected =
    currentFiltered.length > 0 &&
    currentFiltered.every((s) => currentSelected.has(s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="heading-font">Manage Students</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <Button
            variant={tab === "enrolled" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setTab("enrolled"); setSearch(""); setFilterBatch("all"); setFilterDegree("all"); }}
            className={tab === "enrolled" ? "bg-blue-600" : "text-slate-400"}
          >
            Enrolled ({enrolledStudents.length})
          </Button>
          <Button
            variant={tab === "add" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setTab("add"); setSearch(""); setFilterBatch("all"); setFilterDegree("all"); }}
            className={tab === "add" ? "bg-blue-600" : "text-slate-400"}
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Add Students
          </Button>
        </div>

        {/* Filters: Search + Batch + Degree */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or index..."
              className="border-slate-700 bg-slate-900 pl-9 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="border-slate-700 bg-slate-900 text-white flex-1">
                <SelectValue placeholder="All Batches" />
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
              <SelectTrigger className="border-slate-700 bg-slate-900 text-white flex-1">
                <SelectValue placeholder="All Degrees" />
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
            {(filterBatch !== "all" || filterDegree !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-slate-400 hover:text-white px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Select All + Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {currentFiltered.length} student(s)
            {currentSelected.size > 0 && ` · ${currentSelected.size} selected`}
          </p>
          {currentFiltered.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={tab === "enrolled" ? handleSelectAllRemove : handleSelectAllAdd}
              className="text-xs text-blue-400 hover:text-blue-300 h-7 px-2"
            >
              {allVisibleSelected ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        {/* Student List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-3">
            {tab === "enrolled" ? (
              filteredEnrolled.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No students enrolled
                </p>
              ) : (
                filteredEnrolled.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    selected={selectedToRemove.has(s.id)}
                    onToggle={() => toggleRemove(s.id)}
                  />
                ))
              )
            ) : filteredAvailable.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">
                No available students found
              </p>
            ) : (
              filteredAvailable.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  selected={selectedToAdd.has(s.id)}
                  onToggle={() => toggleAdd(s.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          {tab === "enrolled" && selectedToRemove.size > 0 && (
            <Button
              onClick={handleUnenroll}
              disabled={unenroll.isPending}
              variant="destructive"
              className="gap-2"
            >
              <UserMinus className="h-4 w-4" />
              {unenroll.isPending
                ? "Removing..."
                : `Remove ${selectedToRemove.size} Student(s)`}
            </Button>
          )}
          {tab === "add" && selectedToAdd.size > 0 && (
            <Button
              onClick={handleEnroll}
              disabled={enroll.isPending}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {enroll.isPending
                ? "Adding..."
                : `Add ${selectedToAdd.size} Student(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const router = useRouter();
  const { data: modules = [], isLoading } = useModules();
  const deleteModule = useDeleteModule();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleWithStats | undefined>();
  const [studentPickerModule, setStudentPickerModule] = useState<string | null>(null);

  const filtered = modules.filter(
    (m) =>
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingModule(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (mod: ModuleWithStats) => {
    setEditingModule(mod);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this module and all its lectures?")) {
      deleteModule.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-font text-2xl font-bold text-white">Modules</h1>
          <p className="text-sm text-slate-400">
            Manage your modules and student enrollment
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="border-slate-700 bg-slate-900 pl-9 text-white"
        />
      </div>

      {/* Module Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5">
                <div className="h-32 animate-pulse rounded bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <GraduationCap className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No modules found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mod) => (
            <Card
              key={mod.id}
              className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-slate-700 transition-colors cursor-pointer group"
              onClick={() => router.push(`/dashboard/modules/${mod.id}/attendance`)}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-2">
                    {mod.code}
                  </Badge>
                  <CardTitle className="text-base text-white">{mod.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-slate-700 bg-slate-900">
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`/dashboard/modules/${mod.id}/attendance`);
                      }}
                      className="text-cyan-400 focus:text-cyan-400"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Attendance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleEdit(mod);
                      }}
                      className="text-white"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setStudentPickerModule(mod.id);
                      }}
                      className="text-white"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Students
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDelete(mod.id);
                      }}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-0">
                {mod.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {mod.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {mod.student_count} students
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {mod.lecture_count} lectures
                  </span>
                  {mod.credits && (
                    <span>{mod.credits} credits</span>
                  )}
                </div>
                {mod.semester && (
                  <Badge variant="outline" className="mt-2 text-xs text-slate-400 border-slate-700">
                    Semester {mod.semester}
                  </Badge>
                )}

                {/* Quick actions */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-center gap-2 text-blue-400 hover:bg-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentPickerModule(mod.id);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Students
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-center gap-2 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/modules/${mod.id}/attendance`);
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Attendance
                  </Button>
                </div>

                {/* Click hint */}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 group-hover:text-blue-400 transition-colors justify-center">
                  <Eye className="h-3 w-3" />
                  <span>Click to view attendance report</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module Form Dialog */}
      {dialogOpen && (
        <ModuleFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          module={editingModule}
        />
      )}

      {/* Student Picker Dialog */}
      {studentPickerModule && (
        <StudentPickerDialog
          open={!!studentPickerModule}
          onOpenChange={(open) => {
            if (!open) setStudentPickerModule(null);
          }}
          moduleId={studentPickerModule}
        />
      )}
    </div>
  );
}
