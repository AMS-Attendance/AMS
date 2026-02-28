"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  BookOpen,
  Radio,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useLectures,
  useModules,
  useCreateLecture,
  useUpdateLecture,
  useDeleteLecture,
} from "@/lib/api/client";
import type { LectureWithStats, CreateLecturePayload, LectureType, LectureStatus } from "@/lib/types";
import { LECTURE_TYPE_LABELS } from "@/lib/types";

// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LectureStatus }) {
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

// ── Type Badge ───────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: LectureType }) {
  const colors: Record<string, string> = {
    LECTURE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    LAB: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    TUTORIAL: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    SEMINAR: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return (
    <Badge variant="outline" className={colors[type] ?? "text-slate-400"}>
      {LECTURE_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

// ── Lecture Form Dialog ──────────────────────────────────────────────────
function LectureFormDialog({
  open,
  onOpenChange,
  lecture,
  modules,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecture?: LectureWithStats;
  modules: { id: string; code: string; name: string }[];
}) {
  const create = useCreateLecture();
  const update = useUpdateLecture();
  const isEditing = !!lecture;

  const [form, setForm] = useState<{
    module_id: string;
    title: string;
    scheduled_at: string;
    duration_hours: string;
    location: string;
    type: LectureType;
    description: string;
    status?: LectureStatus;
  }>(() => {
    if (lecture) {
      // Format date for datetime-local input
      const dt = new Date(lecture.scheduled_at);
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      return {
        module_id: lecture.module_id,
        title: lecture.title,
        scheduled_at: localIso,
        duration_hours: lecture.duration_hours ?? "2 hours",
        location: lecture.location ?? "",
        type: lecture.type,
        description: lecture.description ?? "",
        status: lecture.status,
      };
    }
    return {
      module_id: modules[0]?.id ?? "",
      title: "",
      scheduled_at: "",
      duration_hours: "2 hours",
      location: "",
      type: "LECTURE" as LectureType,
      description: "",
    };
  });

  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.scheduled_at) { setError("Schedule is required"); return; }
    if (!form.module_id) { setError("Module is required"); return; }

    if (isEditing && lecture) {
      update.mutate(
        {
          id: lecture.id,
          title: form.title.trim(),
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          duration_hours: form.duration_hours,
          location: form.location || undefined,
          type: form.type,
          description: form.description || undefined,
          status: form.status,
        },
        {
          onSuccess: (res) => {
            if (res.success) onOpenChange(false);
            else setError(res.message);
          },
        }
      );
    } else {
      const payload: CreateLecturePayload = {
        module_id: form.module_id,
        title: form.title.trim(),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_hours: form.duration_hours,
        location: form.location || undefined,
        type: form.type,
        description: form.description || undefined,
      };
      console.log("Creating lecture with payload:", payload);
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
            {isEditing ? "Edit Lecture" : "New Lecture"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Module</Label>
            <Select
              value={form.module_id}
              onValueChange={(v) => setForm({ ...form, module_id: v })}
            >
              <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                {modules.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-white">
                    {m.code} — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Introduction to Data Structures"
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Duration</Label>
              <Select
                value={form.duration_hours}
                onValueChange={(v) => setForm({ ...form, duration_hours: v })}
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  <SelectItem value="1 hour" className="text-white">1 hour</SelectItem>
                  <SelectItem value="2 hours" className="text-white">2 hours</SelectItem>
                  <SelectItem value="3 hours" className="text-white">3 hours</SelectItem>
                  <SelectItem value="4 hours" className="text-white">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as LectureType })
                }
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  {(["LECTURE", "LAB", "TUTORIAL", "SEMINAR"] as LectureType[]).map((t) => (
                    <SelectItem key={t} value={t} className="text-white">{LECTURE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Room A101"
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as LectureStatus })
                }
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  {["SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
                    <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              className="border-slate-700 bg-slate-900 text-white resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LecturesPage() {
  const router = useRouter();
  const { data: lectures = [], isLoading } = useLectures();
  const { data: modules = [] } = useModules();
  const deleteLecture = useDeleteLecture();

  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LectureWithStats | undefined>();

  // Filter
  const filtered = lectures.filter((lec) => {
    const matchSearch =
      lec.title.toLowerCase().includes(search.toLowerCase()) ||
      lec.module_code.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === "all" || lec.module_id === filterModule;
    const matchStatus = filterStatus === "all" || lec.status === filterStatus;
    return matchSearch && matchModule && matchStatus;
  });

  const handleEdit = (lec: LectureWithStats) => {
    setEditingLecture(lec);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLecture(undefined);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lecture?")) {
      deleteLecture.mutate(id);
    }
  };

  const moduleOptions = modules.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-font text-2xl font-bold text-white">Lectures</h1>
          <p className="text-sm text-slate-400">
            Manage your lectures and track attendance
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          New Lecture
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lectures..."
            className="border-slate-700 bg-slate-900 pl-9 text-white"
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-[200px] border-slate-700 bg-slate-900 text-white">
            <Filter className="mr-2 h-4 w-4 text-slate-500" />
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900">
            <SelectItem value="all" className="text-white">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-white">
                {m.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] border-slate-700 bg-slate-900 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="SCHEDULED" className="text-white">Scheduled</SelectItem>
            <SelectItem value="COMPLETED" className="text-white">Completed</SelectItem>
            <SelectItem value="CANCELLED" className="text-white">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lecture Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5">
                <div className="h-24 animate-pulse rounded bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <BookOpen className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No lectures found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lec) => {
            const attendanceRate =
              lec.total_students > 0
                ? Math.round((lec.present_count / lec.total_students) * 100)
                : 0;

            return (
              <Card
                key={lec.id}
                className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-slate-700 transition-colors cursor-pointer group"
                onClick={() => router.push(`/dashboard/live?lecture_id=${lec.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeBadge type={lec.type} />
                        <StatusBadge status={lec.status} />
                      </div>
                      <h3 className="text-base font-medium text-white mt-2">
                        {lec.title}
                      </h3>
                      <p className="text-xs text-slate-500">{lec.module_code} — {lec.module_name}</p>
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
                            router.push(`/dashboard/live?lecture_id=${lec.id}`);
                          }}
                          className="text-cyan-400 focus:text-cyan-400"
                        >
                          <Radio className="mr-2 h-4 w-4" />
                          View Live
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEdit(lec);
                          }}
                          className="text-white"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDelete(lec.id);
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(lec.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(lec.scheduled_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {lec.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {lec.location}
                      </span>
                    )}
                  </div>

                  {/* Attendance bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Attendance</span>
                      <span className="text-white font-medium">
                        {lec.present_count}/{lec.total_students} ({attendanceRate}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>

                  {/* View Live hint */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 group-hover:text-blue-400 transition-colors">
                    <Eye className="h-3 w-3" />
                    <span>Click to view live attendance</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <LectureFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          lecture={editingLecture}
          modules={moduleOptions}
        />
      )}
    </div>
  );
}
