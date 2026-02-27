import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginAction, signupAction, logoutAction, getCurrentUser } from "@/lib/api/server";
import type { LoginPayload, SignupPayload } from "@/lib/types";

// ── Query keys ─────────────────────────────────────────────────────────────
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
};

// ── useCurrentUser ─────────────────────────────────────────────────────────
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// ── useLogin ───────────────────────────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      }
    },
  });
}

// ── useSignup ──────────────────────────────────────────────────────────────
export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignupPayload) => signupAction(payload),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      }
    },
  });
}

// ── useLogout ──────────────────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutAction(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}
