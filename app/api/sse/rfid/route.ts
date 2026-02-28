import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint for RFID registration scans.
 * Devices POST to /api/rfid/scan, which adds to a global queue.
 * This SSE stream sends queued RFIDs to connected clients.
 *
 * Usage: GET /api/sse/rfid
 * Headers: Cookie with ams_token
 */

// Global queue of pending RFID scans (in production, use Redis or similar)
type RfidEntry = { rfid: string; timestamp: string };
const rfidQueue: RfidEntry[] = [];
const subscribers = new Set<(entry: RfidEntry) => void>();

// Export for use by the POST endpoint
export function pushRfid(rfid: string) {
  const entry: RfidEntry = { rfid, timestamp: new Date().toISOString() };
  rfidQueue.push(entry);
  // Keep only last 100
  if (rfidQueue.length > 100) rfidQueue.shift();
  // Notify all SSE subscribers
  for (const cb of subscribers) {
    cb(entry);
  }
}

export async function GET(req: NextRequest) {
  // Auth check
  const token = req.cookies.get("ams_token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Only lecturers and admins can access
  if (payload.role !== "lecturer" && payload.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let alive = true;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`)
      );

      // Subscribe to new RFID scans
      const handler = (entry: RfidEntry) => {
        if (!alive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: rfid_scanned\ndata: ${JSON.stringify(entry)}\n\n`)
          );
        } catch {
          alive = false;
        }
      };

      subscribers.add(handler);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (!alive) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          alive = false;
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        alive = false;
        subscribers.delete(handler);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      alive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
