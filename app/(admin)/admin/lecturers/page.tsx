"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Power,
  Trash2,
  Mail,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminLecturers,
  useCreateLecturer,
  useToggleLecturerActive,
  useDeleteLecturer,
} from "@/lib/api/client";
import type { AdminLecturer } from "@/lib/types";

// ── Create Lecturer Dialog ─────────────────────────────────────────────────
function CreateLecturerDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const createLecturer = useCreateLecturer();

  const handleSubmit = () => {
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    createLecturer.mutate(form, {
      onSuccess: (data) => {
        if (data.success) {
          setOpen(false);
          setForm({ name: "", email: "", password: "" });
        } else {
          setError(data.message);
        }
      },
      onError: () => setError("Something went wrong"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-red-600 hover:bg-red-500 text-white">
          <Plus className="h-4 w-4" />
          Add Lecturer
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lecturer Account</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new lecturer account. They can log in immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Full Name</Label>
            <Input
              placeholder="Dr. John Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Email</Label>
            <Input
              type="email"
              placeholder="john@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Password</Label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createLecturer.isPending}
            className="bg-red-600 hover:bg-red-500 text-white gap-2"
          >
            {createLecturer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Lecturer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminLecturersPage() {
  const { data: lecturers = [], isLoading } = useAdminLecturers();
  const toggleActive = useToggleLecturerActive();
  const deleteLecturer = useDeleteLecturer();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = (lecturers as AdminLecturer[]).filter(
    (l: AdminLecturer) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (lecturers as AdminLecturer[]).filter((l: AdminLecturer) => l.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-red-400" />
            Manage Lecturers
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {lecturers.length} total &middot; {activeCount} active
          </p>
        </div>
        <CreateLecturerDialog />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search by name or email..."
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
              <Users className="h-10 w-10 mb-2" />
              <p className="text-sm">
                {search ? "No lecturers match your search" : "No lecturers yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Modules</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Joined</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lec: AdminLecturer) => (
                  <TableRow key={lec.id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white">
                          {lec.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{lec.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        {lec.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                        {lec.module_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          lec.is_active
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            : "border-red-500/30 text-red-400 bg-red-500/10"
                        }
                      >
                        {lec.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(lec.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-slate-800 bg-slate-950 text-white">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() =>
                              toggleActive.mutate({
                                id: lec.id,
                                isActive: !lec.is_active,
                              })
                            }
                          >
                            <Power className="h-4 w-4" />
                            {lec.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem
                            className="gap-2 text-red-400 focus:text-red-400 cursor-pointer"
                            onClick={() => setConfirmDelete(lec.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this lecturer? This action cannot be undone.
              All associated modules and data may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="text-slate-400">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={deleteLecturer.isPending}
              onClick={() => {
                if (confirmDelete) {
                  deleteLecturer.mutate(confirmDelete, {
                    onSuccess: () => setConfirmDelete(null),
                  });
                }
              }}
            >
              {deleteLecturer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
