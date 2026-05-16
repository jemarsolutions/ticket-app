import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const EMAIL_OCTOPUS_WEBHOOK_SECRET =
  process.env.EMAIL_OCTOPUS_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if EmailOctopus provides one
    const signature = request.headers.get("x-emailoctopus-signature");

    if (EMAIL_OCTOPUS_WEBHOOK_SECRET && signature) {
      // Verify signature (implementation depends on EmailOctopus's webhook signature format)
      const expectedSignature = generateSignature(
        body,
        EMAIL_OCTOPUS_WEBHOOK_SECRET,
      );
      if (signature !== expectedSignature) {
        console.error("Invalid EmailOctopus webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    console.log("EmailOctopus webhook received:", body);

    // Handle different webhook events
    const eventType = body.event || body.type;

    switch (eventType) {
      case "subscribed":
        await handleSubscribed(body);
        break;
      case "unsubscribed":
        await handleUnsubscribed(body);
        break;
      case "email_bounced":
        await handleEmailBounced(body);
        break;
      case "email_complained":
        await handleEmailComplained(body);
        break;
      default:
        console.log(`Unhandled EmailOctopus event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("EmailOctopus webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleSubscribed(data: Record<string, unknown>) {
  console.log("User subscribed:", data);
  // Handle new subscription
  // Could update your database, trigger welcome email, etc.
}

async function handleUnsubscribed(data: Record<string, unknown>) {
  console.log("User unsubscribed:", data);
  // Handle unsubscribe
  // Update database to mark user as unsubscribed
}

async function handleEmailBounced(data: Record<string, unknown>) {
  console.log("Email bounced:", data);
  // Handle bounced email
  // Mark email as invalid in your database
}

async function handleEmailComplained(data: Record<string, unknown>) {
  console.log("Email complained (spam):", data);
  // Handle spam complaint
  // Remove user from list or mark as problematic
}

// Simple signature generation (adjust based on EmailOctopus's actual implementation)
function generateSignature(
  body: Record<string, unknown>,
  secret: string,
): string {
  const payload = JSON.stringify(body);
  return createHmac("sha256", secret).update(payload).digest("hex");
}
