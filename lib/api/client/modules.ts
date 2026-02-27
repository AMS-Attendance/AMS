import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getModulesAction,
  getModuleByIdAction,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  getModuleStudentsAction,
  getAvailableStudentsAction,
  enrollStudentsAction,
  unenrollStudentsAction,
} from "@/lib/api/server";
import type { CreateModulePayload, UpdateModulePayload, EnrollStudentsPayload, UnenrollStudentsPayload } from "@/lib/types";
import { dashboardKeys } from "./dashboard";

// ── Query keys ─────────────────────────────────────────────────────────────
export const moduleKeys = {
  all: ["modules"] as const,
  list: () => [...moduleKeys.all, "list"] as const,
  byId: (id: string) => [...moduleKeys.all, "detail", id] as const,
  students: (moduleId: string) => [...moduleKeys.all, "students", moduleId] as const,
  available: (moduleId: string) => [...moduleKeys.all, "available", moduleId] as const,
};

// ── useModules ─────────────────────────────────────────────────────────────
export function useModules() {
  return useQuery({
    queryKey: moduleKeys.list(),
    queryFn: () => getModulesAction(),
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data ?? [],
  });
}

// ── useModuleById ──────────────────────────────────────────────────────────
export function useModuleById(id: string) {
  return useQuery({
    queryKey: moduleKeys.byId(id),
    queryFn: () => getModuleByIdAction(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    select: (res) => res.data,
  });
}

// ── useCreateModule ────────────────────────────────────────────────────────
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModulePayload) => createModuleAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.list() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}

// ── useUpdateModule ────────────────────────────────────────────────────────
export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateModulePayload) => updateModuleAction(payload),
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.list() });
        queryClient.invalidateQueries({ queryKey: moduleKeys.byId(data.data.id) });
      }
    },
  });
}

// ── useDeleteModule ────────────────────────────────────────────────────────
export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => deleteModuleAction(moduleId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.list() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}

// ── useModuleStudents ──────────────────────────────────────────────────────
export function useModuleStudents(moduleId: string) {
  return useQuery({
    queryKey: moduleKeys.students(moduleId),
    queryFn: () => getModuleStudentsAction(moduleId),
    enabled: !!moduleId,
    staleTime: 1000 * 60,
    select: (res) => res.data ?? [],
  });
}

// ── useAvailableStudents ───────────────────────────────────────────────────
export function useAvailableStudents(moduleId: string) {
  return useQuery({
    queryKey: moduleKeys.available(moduleId),
    queryFn: () => getAvailableStudentsAction(moduleId),
    enabled: !!moduleId,
    staleTime: 1000 * 30,
    select: (res) => res.data ?? [],
  });
}

// ── useEnrollStudents ──────────────────────────────────────────────────────
export function useEnrollStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EnrollStudentsPayload) => enrollStudentsAction(payload),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.students(variables.module_id) });
        queryClient.invalidateQueries({ queryKey: moduleKeys.available(variables.module_id) });
        queryClient.invalidateQueries({ queryKey: moduleKeys.list() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}

// ── useUnenrollStudents ────────────────────────────────────────────────────
export function useUnenrollStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UnenrollStudentsPayload) => unenrollStudentsAction(payload),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.students(variables.module_id) });
        queryClient.invalidateQueries({ queryKey: moduleKeys.available(variables.module_id) });
        queryClient.invalidateQueries({ queryKey: moduleKeys.list() });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      }
    },
  });
}
