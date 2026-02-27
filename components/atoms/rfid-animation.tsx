"use client";

import { useState } from "react";
import { CheckCircle, Radio } from "lucide-react";

type RFIDStatus = "idle" | "scanning" | "success";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function RFIDAnimation() {
  const [scanning, setScanning] = useState<boolean>(false);
  const [status, setStatus] = useState<RFIDStatus>("idle");

  const trigger = () => {
    if (scanning) return;
    setScanning(true);
    setStatus("scanning");
    setTimeout(() => {
      setStatus("success");
      setScanning(false);
    }, 1800);
    setTimeout(() => setStatus("idle"), 3500);
  };

  return (
    <div
      onClick={trigger}
      className="relative cursor-pointer select-none"
      title="Click to simulate scan"
    >
      <div
        className={cn(
          "relative w-48 h-64 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4",
          status === "idle" && "border-slate-600 bg-slate-800/60",
          status === "scanning" &&
            "border-blue-400 bg-blue-950/60 shadow-[0_0_40px_rgba(59,130,246,0.4)]",
          status === "success" &&
            "border-emerald-400 bg-emerald-950/60 shadow-[0_0_40px_rgba(52,211,153,0.4)]",
        )}
        style={{ backdropFilter: "blur(12px)" }}
      >
        {/* Top LED strip */}
        <div className="absolute top-4 flex gap-1.5">
          {[0, 1, 2].map((i: number) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                status === "idle" && "bg-slate-600",
                status === "scanning" && "bg-blue-400 animate-pulse",
                status === "success" && "bg-emerald-400",
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Main icon */}
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-500",
            status === "idle" && "border-slate-600 text-slate-400",
            status === "scanning" && "border-blue-400 text-blue-400",
            status === "success" && "border-emerald-400 text-emerald-400",
          )}
        >
          {status === "success" ? (
            <CheckCircle size={36} />
          ) : (
            <Radio
              size={36}
              className={status === "scanning" ? "animate-spin" : ""}
            />
          )}
        </div>

        {/* Scan waves */}
        {status === "scanning" && (
          <>
            {[1, 2, 3].map((i: number) => (
              <div
                key={i}
                className="absolute rounded-full border border-blue-400/40 animate-ping"
                style={{
                  width: `${i * 60 + 60}px`,
                  height: `${i * 60 + 60}px`,
                  animationDuration: `${i * 0.4 + 0.8}s`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </>
        )}

        {/* Status text */}
        <div
          className={cn(
            "text-xs font-mono tracking-widest transition-all duration-300",
            status === "idle" && "text-slate-500",
            status === "scanning" && "text-blue-400",
            status === "success" && "text-emerald-400",
          )}
        >
          {status === "idle" && "READY"}
          {status === "scanning" && "SCANNING..."}
          {status === "success" && "RECORDED ✓"}
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-4 text-[10px] text-slate-500 font-mono tracking-widest">
          AMS-RFID v2
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-3 font-mono">
        click to simulate scan
      </p>
    </div>
  );
}
