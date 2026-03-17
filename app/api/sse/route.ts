import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; 
import { getOverBudgetAlerts } from "@/app/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        // Guard — never write to a closed controller
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream already closed — mark it and stop
          closed = true;
        }
      };

      const checkAlerts = async () => {
        // Stop everything if client disconnected
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const overBudget = await getOverBudgetAlerts(userId);

          if (overBudget.length > 0) {
            overBudget.forEach((b) => {
              send({
                type: "budget_alert",
                categoryName: b.category.name,
                spent: b.spent,
                limit: b.limit,
                overBy: b.spent - b.limit,
              });
            });
          } else {
            send({ type: "heartbeat", timestamp: Date.now() });
          }
        } catch {
          // DB error — don't crash, just skip this check
        }
      };

      // Send initial connection confirmation
      send({ type: "connected", message: "Live alerts active" });

      // First check immediately
      await checkAlerts();

      // Then every 30 seconds
      const interval = setInterval(checkAlerts, 30_000);

      // This runs when the client disconnects
      return () => {
        closed = true;
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}