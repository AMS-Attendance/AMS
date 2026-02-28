/**
 * Next.js Instrumentation — runs once on server startup.
 * Seeds the default admin account if it doesn't exist.
 */
export async function register() {
  // Only run on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        `http://localhost:${process.env.PORT || 3000}`;

      // Use a short delay to ensure the server is ready
      setTimeout(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/admin/seed`);
          const data = await res.json();
          if (data.created) {
            console.log("[Instrumentation] Default admin account created");
          } else {
            console.log("[Instrumentation] Admin account already exists");
          }
        } catch (err) {
          console.warn("[Instrumentation] Admin seed fetch failed (will retry on first request):", (err as Error).message);
        }
      }, 3000);
    } catch (err) {
      console.warn("[Instrumentation] Error:", (err as Error).message);
    }
  }
}
