import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; 
import { getOverBudgetAlerts } from "@/app/lib/data"; 

// app/api/sse/route.ts — add this at the top

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let closed = false;

  // Track which categories have already been alerted this session
  const alertedCategories = new Set<string>();

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

          overBudget.forEach((b) => {
            const key = `${b.category.name}-${b.category.id}`;

            // Only send alert if we haven't already sent one
            // for this category in this session
            if (!alertedCategories.has(key)) {
              alertedCategories.add(key);
              send({
                type: "budget_alert",
                categoryName: b.category.name,
                spent: b.spent,
                limit: b.limit,
                overBy: b.spent - b.limit,
              });
            }
          });

          // If a category comes back under budget
          // remove it from alerted so it can alert again if overspent later
          const overBudgetKeys = new Set(
            overBudget.map((b) => `${b.category.name}-${b.category.id}`)
          );
          alertedCategories.forEach((key) => {
            if (!overBudgetKeys.has(key)) {
              alertedCategories.delete(key);
            }
          });

          // Send heartbeat only if no alerts fired
          if (overBudget.length === 0) {
            send({ type: "heartbeat", timestamp: Date.now() });
          }

        } catch {
          // DB error — skip this check
        }
      };

      send({ type: "connected", message: "Live alerts active" });
      await checkAlerts();
      const interval = setInterval(checkAlerts, 30_000);

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