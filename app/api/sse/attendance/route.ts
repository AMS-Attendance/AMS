import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint for live attendance updates.
 * Polls the attendance table every 2 seconds for new records
 * belonging to the lecturer's modules.
 *
 * Usage: GET /api/sse/attendance?lecture_id=<uuid>
 * Headers: Cookie with ams_token
 */
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

  const lectureId = req.nextUrl.searchParams.get("lecture_id");
  if (!lectureId) {
    return new Response("lecture_id is required", { status: 400 });
  }

  // Verify lecturer owns this lecture's module
  const { data: lecture } = await supabase
    .from("lectures")
    .select("module_id")
    .eq("id", lectureId)
    .single();

  if (!lecture) {
    return new Response("Lecture not found", { status: 404 });
  }

  const { data: mod } = await supabase
    .from("modules")
    .select("id")
    .eq("id", lecture.module_id)
    .eq("lecturer_id", payload.id)
    .single();

  if (!mod) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  let lastChecked = new Date().toISOString();
  let alive = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ lecture_id: lectureId })}\n\n`)
      );

      // Poll loop
      const poll = async () => {
        while (alive) {
          try {
            const { data: newRecords } = await supabase
              .from("attendance")
              .select("*")
              .eq("lecture_id", lectureId)
              .gt("created_at", lastChecked)
              .order("created_at", { ascending: true });

            if (newRecords && newRecords.length > 0) {
              // Fetch student info for each new record
              const studentIds = newRecords.map((r: { student_id: string }) => r.student_id);
              const { data: students } = await supabase
                .from("users")
                .select("id, name, email, index_number, rfid")
                .in("id", studentIds);

              const studentMap = new Map(
                (students ?? []).map((s: { id: string }) => [s.id, s])
              );

              for (const record of newRecords) {
                const student = studentMap.get(record.student_id) as {
                  name: string;
                  email: string;
                  index_number: string | null;
                  rfid: string | null;
                } | undefined;

                const event = {
                  type: "attendance_marked",
                  data: {
                    ...record,
                    student_name: student?.name ?? "Unknown",
                    student_email: student?.email ?? "",
                    index_number: student?.index_number ?? null,
                    rfid: student?.rfid ?? null,
                  },
                  lecture_id: lectureId,
                  timestamp: record.created_at,
                };

                controller.enqueue(
                  encoder.encode(`event: attendance\ndata: ${JSON.stringify(event)}\n\n`)
                );
              }

              // Update checkpoint to latest record
              lastChecked = newRecords[newRecords.length - 1].created_at;
            }

            // Send heartbeat to keep connection alive
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            // If connection closed, break
            alive = false;
            break;
          }

          // Wait 2 seconds before next poll
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      poll();
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
