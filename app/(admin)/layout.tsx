"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Radio,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser, useLogout } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/lecturers", label: "Lecturers", icon: Users },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/modules", label: "Modules", icon: BookOpen },
];

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="heading-font text-lg font-bold text-white">AMS</span>
          <span className="ml-1.5 text-xs font-medium text-red-400">Admin</span>
        </div>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-red-600/20 text-red-400 border border-red-500/30"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-red-400")} />
                {item.label}
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 text-red-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Separator + link to lecturer dashboard */}
        {/* <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="mb-2 px-3 text-xs font-medium uppercase text-slate-600">
            Quick Access
          </p>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-800/60 hover:text-white transition-all"
          >
            <Radio className="h-4 w-4" />
            Lecturer Dashboard
          </Link>
        </div> */}
      </ScrollArea>

      {/* User / Logout */}
      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-400 text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user?.name ?? "Loading..."}
            </p>
            <p className="truncate text-xs text-red-400 font-medium">
              Administrator
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          {logout.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth gate: redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050d1f]">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  // Not admin? Show nothing (redirect happening via useEffect)
  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050d1f]">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400 mb-3" />
          <p className="text-white font-medium">Access Denied</p>
          <p className="text-sm text-slate-400 mt-1">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050d1f]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950/80 lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 lg:hidden text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 border-slate-800 bg-slate-950 p-0"
        >
          <div className="absolute right-3 top-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="p-6 lg:p-8">{children}</div>
        </ScrollArea>
      </main>
    </div>
  );
}
