// app/api/sse/route.ts

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
  let interval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      const checkAlerts = async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const overBudget = await getOverBudgetAlerts(userId);

          // Always send current over-budget state — client handles deduplication
          overBudget.forEach((b) => {
            send({
              type: "budget_alert",
              categoryName: b.category.name,
              spent: b.spent,
              limit: b.limit,
              overBy: b.spent - b.limit,
            });
          });

          // Send cleared signal for categories that are no longer over budget
          // Client uses this to remove stale alerts
          send({
            type: "budget_state",
            overBudgetCategories: overBudget.map((b) => b.category.name),
          });

          if (overBudget.length === 0) {
            send({ type: "heartbeat", timestamp: Date.now() });
          }
        } catch {
          // DB error — skip this tick
        }
      };

      // Send connected signal
      send({ type: "connected", message: "Live alerts active" });

      // Small delay so client can attach onmessage before first check
      await new Promise((resolve) => setTimeout(resolve, 300));
      await checkAlerts();

      // Poll every 5s for near-realtime feedback after transactions are added
      interval = setInterval(checkAlerts, 5_000);

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