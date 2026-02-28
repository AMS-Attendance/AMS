import { useEffect, useRef, useState, useCallback } from "react";

export type RfidSSEStatus = "connecting" | "connected" | "disconnected" | "error";

export interface RfidScanEvent {
  rfid: string;
  timestamp: string;
}

export function useRfidSSE() {
  const [lastScan, setLastScan] = useState<RfidScanEvent | null>(null);
  const [status, setStatus] = useState<RfidSSEStatus>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");

    const es = new EventSource("/api/sse/rfid");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setStatus("connected");
    });

    es.addEventListener("rfid_scanned", (event) => {
      try {
        const parsed: RfidScanEvent = JSON.parse(event.data);
        setLastScan(parsed);
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
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { lastScan, status, connect, disconnect, reconnect };
}
