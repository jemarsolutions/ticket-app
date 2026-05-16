import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const TICKET_TAILOR_WEBHOOK_SECRET =
  process.env.TICKET_TAILOR_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if Ticket Tailor provides one
    const signature = request.headers.get("x-tickettailor-signature");

    if (TICKET_TAILOR_WEBHOOK_SECRET && signature) {
      // Verify signature (implementation depends on Ticket Tailor's webhook signature format)
      const expectedSignature = generateSignature(
        body,
        TICKET_TAILOR_WEBHOOK_SECRET,
      );
      if (signature !== expectedSignature) {
        console.error("Invalid Ticket Tailor webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    console.log("Ticket Tailor webhook received:", body);

    // Handle different webhook events
    const eventType = body.event_type || body.type;

    switch (eventType) {
      case "ticket.created":
        await handleTicketCreated(body);
        break;
      case "ticket.purchased":
        await handleTicketPurchased(body);
        break;
      case "order.completed":
        await handleOrderCompleted(body);
        break;
      default:
        console.log(`Unhandled Ticket Tailor event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Ticket Tailor webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleTicketCreated(data: Record<string, unknown>) {
  console.log("Ticket created:", data);
  // Handle ticket creation logic
  // Update database, send notifications, etc.
}

async function handleTicketPurchased(data: Record<string, unknown>) {
  console.log("Ticket purchased:", data);
  // Handle ticket purchase logic
  // Could trigger email confirmation, etc.
}

async function handleOrderCompleted(data: Record<string, unknown>) {
  console.log("Order completed:", data);
  // Handle order completion logic
  // This is where you might want to send final confirmation
}

// Simple signature generation (adjust based on Ticket Tailor's actual implementation)
function generateSignature(
  body: Record<string, unknown>,
  secret: string,
): string {
  const payload = JSON.stringify(body);
  return createHmac("sha256", secret).update(payload).digest("hex");
}
