"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  UserPlus,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useCheckRfid,
  useSearchStudents,
  useAssignRfid,
  useRegisterStudent,
} from "@/lib/api/client";
import { useRfidSSE, type RfidSSEStatus } from "@/lib/hooks/use-rfid-sse";
import type { Student } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────
interface RFIDLog {
  rfid: string;
  timestamp: string;
  status: "exists" | "registered" | "pending";
  student?: Student;
}

// ── Connection Status ──────────────────────────────────────────────────────
function ConnectionStatus({
  status,
  onReconnect,
}: {
  status: RfidSSEStatus;
  onReconnect: () => void;
}) {
  const config: Record<
    RfidSSEStatus,
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

// ── Student Registration Form Dialog ───────────────────────────────────────
function StudentRegistrationForm({
  open,
  onClose,
  rfid,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  rfid: string;
  onSuccess: (student: Student) => void;
}) {
  const register = useRegisterStudent();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    indexNumber: "",
    degree: "",
    batch: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.indexNumber) {
      setError("Name, email, password, and index number are required");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.batch && (parseInt(formData.batch) < 20 || parseInt(formData.batch) > 30)) {
      setError("Batch must be between 20 and 30");
      return;
    }

    register.mutate(
      {
        name: formData.name,
        email: formData.email.toLowerCase(),
        password: formData.password,
        index_number: formData.indexNumber,
        rfid,
        degree: formData.degree || undefined,
        batch: formData.batch ? parseInt(formData.batch) : undefined,
      },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data);
            resetForm();
            onClose();
          } else {
            setError(res.message);
          }
        },
      }
    );
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", indexNumber: "", degree: "", batch: "" });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 heading-font">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Register New Student
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Register a new student with RFID:{" "}
            <span className="font-mono font-semibold text-blue-400">{rfid}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="A.L.P.Perera..."
              disabled={register.isPending}
              className="border-slate-700 bg-slate-900 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john.doe@example.com"
              disabled={register.isPending}
              className="border-slate-700 bg-slate-900 text-white"
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Index Number <span className="text-red-400">*</span>
            </Label>
            <Input
              name="indexNumber"
              value={formData.indexNumber}
              onChange={handleChange}
              placeholder="e.g., 224187F"
              disabled={register.isPending}
              className="border-slate-700 bg-slate-900 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Password <span className="text-red-400">*</span>
            </Label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              disabled={register.isPending}
              className="border-slate-700 bg-slate-900 text-white"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Degree</Label>
              <Input
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="IT, ITM..."
                disabled={register.isPending}
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Batch</Label>
              <Input
                name="batch"
                type="number"
                value={formData.batch}
                onChange={handleChange}
                placeholder="22, 21..."
                min="20"
                max="30"
                disabled={register.isPending}
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={register.isPending}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={register.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {register.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Student
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RfidRegistrationPage() {
  const { lastScan, status, reconnect } = useRfidSSE();
  const checkRfid = useCheckRfid();
  const searchStudents = useSearchStudents();
  const assignRfid = useAssignRfid();

  const [currentRfid, setCurrentRfid] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [logs, setLogs] = useState<RFIDLog[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const addLog = useCallback(
    (rfid: string, logStatus: "exists" | "registered" | "pending", student?: Student) => {
      setLogs((prev) => [
        { rfid, timestamp: new Date().toLocaleTimeString(), status: logStatus, student },
        ...prev,
      ].slice(0, 100));
    },
    []
  );

  // Process RFID scans from SSE
  const handleRfidScan = useCallback(
    (rfid: string) => {
      setCurrentRfid(rfid);
      setSearchResults([]);
      setSearchQuery("");

      checkRfid.mutate(rfid, {
        onSuccess: (res) => {
          if (res.success) {
            if (res.data) {
              // RFID already registered
              addLog(rfid, "exists", res.data);
              setAlert({
                type: "info",
                message: `RFID already registered to ${res.data.name} (${res.data.index_number})`,
              });
            } else {
              addLog(rfid, "pending");
              setAlert({
                type: "info",
                message: "RFID not found. Search for the student or register a new student.",
              });
            }
          } else {
            setAlert({ type: "error", message: res.message });
          }
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addLog]
  );

  // Listen for SSE scans
  useEffect(() => {
    if (lastScan) {
      handleRfidScan(lastScan.rfid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastScan]);

  const handleManualRfidCheck = () => {
    if (currentRfid.trim()) {
      handleRfidScan(currentRfid.trim());
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setAlert({ type: "error", message: "Search query must be at least 2 characters" });
      return;
    }
    setAlert(null);
    searchStudents.mutate(searchQuery.trim(), {
      onSuccess: (res) => {
        if (res.success) {
          setSearchResults(res.data ?? []);
          if ((res.data ?? []).length === 0) {
            setAlert({ type: "info", message: "No students found. Register as a new student?" });
          }
        } else {
          setAlert({ type: "error", message: res.message });
        }
      },
    });
  };

  const handleAssignRfid = (student: Student) => {
    if (!currentRfid) {
      setAlert({ type: "error", message: "No RFID to assign" });
      return;
    }
    if (student.rfid) {
      setAlert({ type: "error", message: `This student already has an RFID: ${student.rfid}` });
      return;
    }

    setAssigningId(student.id);
    assignRfid.mutate(
      { studentId: student.id, rfid: currentRfid },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            addLog(currentRfid, "registered", res.data);
            setAlert({ type: "success", message: `RFID successfully assigned to ${student.name}!` });
            setSearchResults([]);
            setSearchQuery("");
            setCurrentRfid("");
          } else {
            setAlert({ type: "error", message: res.message });
          }
          setAssigningId(null);
        },
      }
    );
  };

  const handleRegistrationSuccess = (student: Student) => {
    addLog(currentRfid, "registered", student);
    setAlert({ type: "success", message: `New student ${student.name} registered successfully with RFID!` });
    setCurrentRfid("");
    setSearchResults([]);
    setSearchQuery("");
  };

  // Alert colors
  const alertColors = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-font text-2xl font-bold text-white">RFID Registration</h1>
          <p className="text-sm text-slate-400">
            Register RFID cards for students in real-time
          </p>
        </div>
        <ConnectionStatus status={status} onReconnect={reconnect} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - RFID Input & Search */}
        <div className="lg:col-span-2 space-y-6">
          {/* RFID Scanner Card */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                RFID Scanner
              </h2>

              {alert && (
                <div className={`rounded-lg border p-3 text-sm mb-4 ${alertColors[alert.type]}`}>
                  {alert.message}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={currentRfid}
                  onChange={(e) => setCurrentRfid(e.target.value)}
                  placeholder="Scan RFID or enter manually..."
                  className="flex-1 text-lg font-mono border-slate-700 bg-slate-900 text-white"
                  disabled={checkRfid.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManualRfidCheck();
                  }}
                />
                <Button
                  onClick={handleManualRfidCheck}
                  disabled={!currentRfid || checkRfid.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {checkRfid.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Check
                    </>
                  )}
                </Button>
              </div>

              {checkRfid.isPending && (
                <div className="flex items-center gap-2 text-blue-400 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Checking RFID...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Search Card */}
          {currentRfid && !checkRfid.isPending && (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  Search Student
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or index number..."
                      className="flex-1 border-slate-700 bg-slate-900 text-white"
                      disabled={searchStudents.isPending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery || searchStudents.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {searchStudents.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400 font-medium">
                        Found {searchResults.length} student(s):
                      </p>
                      <ScrollArea className="max-h-72">
                        <div className="space-y-2 pr-2">
                          {searchResults.map((student) => (
                            <div
                              key={student.id}
                              className="rounded-lg border border-slate-800 bg-slate-800/30 p-4 hover:border-blue-500/30 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-white">{student.name}</h3>
                                  <p className="text-sm text-slate-500">Index: {student.index_number}</p>
                                  <p className="text-sm text-slate-500">Email: {student.email}</p>
                                  {student.degree && (
                                    <p className="text-sm text-slate-500">
                                      {student.degree} — Batch {student.batch}
                                    </p>
                                  )}
                                  {student.rfid && (
                                    <p className="text-sm text-orange-400 mt-1">
                                      Already has RFID: {student.rfid}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleAssignRfid(student)}
                                  disabled={!!student.rfid || assigningId === student.id}
                                  className={
                                    student.rfid
                                      ? "bg-slate-700 cursor-not-allowed text-slate-400"
                                      : "bg-green-600 hover:bg-green-700 text-white"
                                  }
                                  size="sm"
                                >
                                  {assigningId === student.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-1" />
                                      Assign
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Register New Student */}
                  <div className="pt-4 border-t border-slate-800">
                    <Button
                      onClick={() => setShowRegistrationForm(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register as New Student
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activity Log */}
        <div className="lg:col-span-1">
          <Card className="border-slate-800 bg-slate-900/50 sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Activity Log</h2>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                      <p className="text-xs mt-1">Scan an RFID card to begin</p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={`${log.rfid}-${log.timestamp}-${index}`}
                        className={`p-3 rounded-lg border ${
                          log.status === "registered"
                            ? "bg-green-500/10 border-green-500/30"
                            : log.status === "exists"
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-yellow-500/10 border-yellow-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {log.status === "registered" ? (
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : log.status === "exists" ? (
                            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">{log.timestamp}</p>
                            <p className="text-sm font-mono font-semibold text-white truncate">
                              {log.rfid}
                            </p>
                            {log.student && (
                              <p className="text-xs text-slate-400 mt-1">
                                {log.student.name} ({log.student.index_number})
                              </p>
                            )}
                            <Badge
                              variant="outline"
                              className={`mt-1 text-xs ${
                                log.status === "registered"
                                  ? "text-green-400 border-green-500/30"
                                  : log.status === "exists"
                                  ? "text-blue-400 border-blue-500/30"
                                  : "text-yellow-400 border-yellow-500/30"
                              }`}
                            >
                              {log.status === "registered"
                                ? "Registered"
                                : log.status === "exists"
                                ? "Already exists"
                                : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Form Dialog */}
      <StudentRegistrationForm
        open={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        rfid={currentRfid}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
