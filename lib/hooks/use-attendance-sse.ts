import { useEffect, useRef, useState, useCallback } from "react";
import type { AttendanceWithStudent, SSEAttendanceEvent } from "@/lib/types";

export type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

export function useAttendanceSSE(lectureId: string | null) {
  const [records, setRecords] = useState<AttendanceWithStudent[]>([]);
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!lectureId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    setRecords([]);

    const es = new EventSource(`/api/sse/attendance?lecture_id=${lectureId}`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setStatus("connected");
    });

    es.addEventListener("attendance", (event) => {
      try {
        const parsed: SSEAttendanceEvent = JSON.parse(event.data);
        setRecords((prev) => {
          // Avoid duplicates
          const exists = prev.some((r) => r.id === parsed.data.id);
          if (exists) return prev;
          return [...prev, parsed.data];
        });
      } catch {
        // Ignore parse errors
      }
    });

    es.onerror = () => {
      setStatus("error");
      es.close();
      // Attempt reconnect after 5s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          connect();
        }
      }, 5000);
    };
  }, [lectureId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (lectureId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [lectureId, connect, disconnect]);

  return { records, status, reconnect: connect, disconnect };
}
