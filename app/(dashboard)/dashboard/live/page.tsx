"use client";

import { useState, useEffect, useRef } from "react";
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLectures, useLectureAttendance } from "@/lib/api/client";
import { useAttendanceSSE, type SSEStatus } from "@/lib/hooks/use-attendance-sse";
import type { AttendanceWithStudent } from "@/lib/types";

// ── Connection Status Indicator ────────────────────────────────────────────
function ConnectionStatus({ status, onReconnect }: { status: SSEStatus; onReconnect: () => void }) {
  const config: Record<
    SSEStatus,
    { icon: React.ElementType; label: string; color: string; dotColor: string }
  > = {
    connecting: { icon: RefreshCw, label: "Connecting...", color: "text-yellow-400", dotColor: "bg-yellow-400" },
    connected: { icon: Wifi, label: "Live", color: "text-green-400", dotColor: "bg-green-400" },
    disconnected: { icon: WifiOff, label: "Disconnected", color: "text-slate-500", dotColor: "bg-slate-500" },
    error: { icon: AlertCircle, label: "Error", color: "text-red-400", dotColor: "bg-red-400" },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`h-2.5 w-2.5 rounded-full ${c.dotColor}`} />
        {status === "connected" && (
          <div className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${c.dotColor} animate-ping`} />
        )}
      </div>
      <Icon className={`h-4 w-4 ${c.color} ${status === "connecting" ? "animate-spin" : ""}`} />
      <span className={`text-sm font-medium ${c.color}`}>{c.label}</span>
      {(status === "error" || status === "disconnected") && (
        <Button variant="ghost" size="sm" onClick={onReconnect} className="text-blue-400 hover:text-blue-300">
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

// ── Attendance Feed Item ───────────────────────────────────────────────────
function FeedItem({ record, isNew }: { record: AttendanceWithStudent; isNew: boolean }) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    PRESENT: { color: "text-green-400 bg-green-500/20 border-green-500/30", icon: CheckCircle2 },
    LATE: { color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30", icon: Clock },
    ABSENT: { color: "text-red-400 bg-red-500/20 border-red-500/30", icon: AlertCircle },
    EXCUSED: { color: "text-blue-400 bg-blue-500/20 border-blue-500/30", icon: AlertCircle },
  };

  const cfg = statusConfig[record.status] ?? statusConfig.PRESENT;
  const StatusIcon = cfg.icon;
  const time = new Date(record.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-500 ${
        isNew
          ? "border-blue-500/50 bg-blue-500/10 animate-pulse"
          : "border-slate-800 bg-slate-800/30"
      }`}
    >
      {/* Method icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
        {record.method === "rfid" ? (
          <CreditCard className="h-5 w-5 text-cyan-400" />
        ) : (
          <User className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{record.student_name}</p>
        <p className="text-xs text-slate-500">
          {record.index_number ?? record.student_email}
          {record.method === "rfid" && (
            <span className="ml-2 text-cyan-400">via RFID</span>
          )}
        </p>
      </div>

      {/* Status & Time */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={cfg.color}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {record.status}
        </Badge>
        <span className="text-xs text-slate-500">{time}</span>
      </div>
    </div>
  );
}

// ── Stats Summary ──────────────────────────────────────────────────────────
function LiveStats({
  records,
  totalStudents,
}: {
  records: AttendanceWithStudent[];
  totalStudents: number;
}) {
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const rfidCount = records.filter((r) => r.method === "rfid").length;
  const attendanceRate = totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-3 text-center">
          <p className="heading-font text-2xl font-bold text-green-400">{present}</p>
          <p className="text-xs text-slate-500">Present</p>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-3 text-center">
          <p className="heading-font text-2xl font-bold text-yellow-400">{late}</p>
          <p className="text-xs text-slate-500">Late</p>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-3 text-center">
          <p className="heading-font text-2xl font-bold text-cyan-400">{rfidCount}</p>
          <p className="text-xs text-slate-500">Via RFID</p>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-3 text-center">
          <p className="heading-font text-2xl font-bold text-white">{attendanceRate}%</p>
          <p className="text-xs text-slate-500">
            {records.length}/{totalStudents}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LiveAttendancePage() {
  const { data: lectures = [] } = useLectures();
  const [selectedLecture, setSelectedLecture] = useState<string>("");
  const { data: existingRecords = [] } = useLectureAttendance(selectedLecture);
  const { records: sseRecords, status, reconnect } = useAttendanceSSE(
    selectedLecture || null
  );

  // Track newly arrived IDs for animation
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevCountRef = useRef(0);

  // Merge existing + SSE records
  const allRecords = [...existingRecords];
  for (const ssr of sseRecords) {
    if (!allRecords.some((r) => r.id === ssr.id)) {
      allRecords.push(ssr);
    }
  }

  // Sort by timestamp descending (newest first)
  allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Animate new arrivals
  useEffect(() => {
    if (allRecords.length > prevCountRef.current) {
      const newest = allRecords.slice(0, allRecords.length - prevCountRef.current);
      const ids = new Set(newest.map((r) => r.id));
      setNewIds(ids);
      setTimeout(() => setNewIds(new Set()), 2000);
    }
    prevCountRef.current = allRecords.length;
  }, [allRecords.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get total students for the selected lecture
  const selectedLectureData = lectures.find((l) => l.id === selectedLecture);
  const totalStudents = selectedLectureData?.total_students ?? 0;

  // Only show scheduled/today's lectures
  const activeLectures = lectures.filter((l) => l.status === "SCHEDULED" || l.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-font text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-400" />
            Live Attendance
          </h1>
          <p className="text-sm text-slate-400">
            Real-time attendance monitoring via SSE
          </p>
        </div>
        {selectedLecture && <ConnectionStatus status={status} onReconnect={reconnect} />}
      </div>

      {/* Lecture Selector */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <Select value={selectedLecture} onValueChange={setSelectedLecture}>
            <SelectTrigger className="border-slate-700 bg-slate-900 text-white max-w-lg">
              <SelectValue placeholder="Select a lecture to monitor..." />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900">
              {activeLectures.map((l) => (
                <SelectItem key={l.id} value={l.id} className="text-white">
                  {l.module_code} — {l.title} ({new Date(l.scheduled_at).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedLecture ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <ZapOff className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              Select a lecture to start monitoring attendance in real-time
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Live Stats */}
          <LiveStats records={allRecords} totalStudents={totalStudents} />

          {/* Attendance Progress */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Overall Progress</span>
                <span className="font-medium text-white">
                  {allRecords.length} / {totalStudents} students marked
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 transition-all duration-700"
                  style={{
                    width: `${totalStudents > 0 ? Math.min((allRecords.length / totalStudents) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Feed */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                Live Feed
                {status === "connected" && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                )}
              </CardTitle>
              <Badge variant="outline" className="text-slate-400 border-slate-700">
                {allRecords.length} records
              </Badge>
            </CardHeader>
            <CardContent>
              {allRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Radio className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
                  <p className="text-sm text-slate-500">
                    Waiting for attendance scans...
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Records will appear here in real-time
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-3">
                    {allRecords.map((record) => (
                      <FeedItem
                        key={record.id}
                        record={record}
                        isNew={newIds.has(record.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
