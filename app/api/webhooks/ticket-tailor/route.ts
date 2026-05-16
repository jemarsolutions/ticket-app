import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const TICKET_TAILOR_WEBHOOK_SECRET =
  process.env.TICKET_TAILOR_WEBHOOK_SECRET || "";

const EMAIL_OCTOPUS_API_KEY = process.env.EMAIL_OCTOPUS_API_KEY || "";
const EMAIL_OCTOPUS_LIST_ID = process.env.EMAIL_OCTOPUS_LIST_ID || "";

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
      case "order.created":
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

async function handleTicketCreated(data: any) {
  console.log("Ticket created:", data.id);
  // Handle ticket creation logic
}

async function handleTicketPurchased(data: any) {
  console.log("Ticket purchased:", data.id);
  // Handle ticket purchase logic
}

async function handleOrderCompleted(data: any) {
  console.log("Order completed:", data.id);
  // Handle order completion logic
  // Extract email and name to add to EmailOctopus
  const payload = data.payload || data;
  let email = payload.buyer_email || payload.email;
  let name = payload.buyer_name || payload.name || "Attendee";

  // Sometimes it's nested in payload.buyer
  if (!email && payload.buyer) {
    email = payload.buyer.email;
    name = payload.buyer.name || name;
  }

  if (email) {
    console.log(`Adding ${email} to Email Octopus...`);
    await addToEmailOctopus(email, name);
  } else {
    console.log("No email found in order data, cannot add to Email Octopus.");
  }
}

async function addToEmailOctopus(email: string, name: string) {
  if (!EMAIL_OCTOPUS_API_KEY || !EMAIL_OCTOPUS_LIST_ID) {
    console.log("Email Octopus credentials missing, skipping.");
    return;
  }

  try {
    // Split full name into first and last name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const response = await fetch(
      `https://emailoctopus.com/api/1.6/lists/${EMAIL_OCTOPUS_LIST_ID}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: EMAIL_OCTOPUS_API_KEY,
          email_address: email,
          fields: {
            FirstName: firstName,
            LastName: lastName,
          },
          status: "SUBSCRIBED",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      // A 422 with "MEMBER_EXISTS_WITH_EMAIL_ADDRESS" is not a failure — just log it
      if (errorText.includes("MEMBER_EXISTS_WITH_EMAIL_ADDRESS")) {
        console.log("EmailOctopus: contact already exists for", email);
      } else {
        console.error("EmailOctopus error:", errorText);
      }
    } else {
      console.log("EmailOctopus: contact added for", email);
    }
  } catch (error) {
    // Non-fatal — don't block registration if email list fails
    console.error("EmailOctopus error (non-fatal):", error);
  }
}

// Simple signature generation (adjust based on Ticket Tailor's actual implementation)
function generateSignature(
  body: Record<string, unknown>,
  secret: string,
): string {
  const payload = JSON.stringify(body);
  return createHmac("sha256", secret).update(payload).digest("hex");
}
