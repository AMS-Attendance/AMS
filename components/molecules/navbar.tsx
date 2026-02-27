"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radio, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["Features", "How It Works", "Stats", "Contact"];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#050d1f]/90 backdrop-blur-md border-b border-slate-800"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            AMS<span className="text-blue-400">.</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
        </div>

        <button
          className="md:hidden text-slate-400"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#050d1f]/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
              className="text-slate-300 hover:text-white text-sm"
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <button
            className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium mt-2"
            onClick={() => router.push("/login")}
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  );
}
