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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Tell the client the connection is live
      send({ type: "connected", message: "Live alerts active" });

      // Check for over budget alerts immediately on connect
      const checkAlerts = async () => {
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
            // Send a heartbeat so the connection stays alive
            send({ type: "heartbeat", timestamp: Date.now() });
          }
        } catch {
          send({ type: "error", message: "Failed to check alerts" });
        }
      };

      // Run immediately on connect
      await checkAlerts();

      // Then check every 30 seconds
      const interval = setInterval(checkAlerts, 30_000);

      // Cleanup when client disconnects
      return () => clearInterval(interval);
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