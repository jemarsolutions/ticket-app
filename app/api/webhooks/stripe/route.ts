import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const TICKET_TAILOR_API_KEY = process.env.TICKET_TAILOR_API_KEY || "";
const TICKET_TAILOR_EVENT_ID = process.env.TICKET_TAILOR_EVENT_ID || "";
const TICKET_TAILOR_TICKET_TYPE_ID =
  process.env.TICKET_TAILOR_TICKET_TYPE_ID || "";

const EMAIL_OCTOPUS_API_KEY = process.env.EMAIL_OCTOPUS_API_KEY || "";
const EMAIL_OCTOPUS_LIST_ID = process.env.EMAIL_OCTOPUS_LIST_ID || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") || "";

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", failedPayment.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata;

  if (!metadata) {
    console.error("Stripe webhook: no metadata in session", session.id);
    return;
  }

  const { name, email, phone, numberOfTickets } = metadata;
  const quantity = parseInt(numberOfTickets, 10);

  console.log("Payment confirmed for:", {
    name,
    email,
    phone,
    numberOfTickets,
    sessionId: session.id,
  });

  // Issue ticket in Ticket Tailor AFTER payment is confirmed
  if (TICKET_TAILOR_API_KEY && TICKET_TAILOR_EVENT_ID && TICKET_TAILOR_TICKET_TYPE_ID) {
    await createTicketTailorIssuedTicket(name, email, phone, quantity);
  } else {
    console.warn(
      "Ticket Tailor not configured — skipping ticket issuance. " +
        "Set TICKET_TAILOR_API_KEY, TICKET_TAILOR_EVENT_ID, and TICKET_TAILOR_TICKET_TYPE_ID in .env.local",
    );
  }

  // EmailOctopus: add as fallback in case registration step was skipped
  if (EMAIL_OCTOPUS_API_KEY && EMAIL_OCTOPUS_LIST_ID) {
    await ensureEmailOctopusContact(email, name);
  }
}

/**
 * Creates an issued ticket in Ticket Tailor using the correct v1 API endpoint.
 *
 * Authentication: HTTP Basic Auth with API key as username, no password.
 * Endpoint: POST /v1/issued_tickets
 * Content-Type: application/x-www-form-urlencoded
 */
async function createTicketTailorIssuedTicket(
  name: string,
  email: string,
  phone: string,
  quantity: number,
) {
  // Build Basic Auth header: base64("apiKey:")
  const credentials = Buffer.from(`${TICKET_TAILOR_API_KEY}:`).toString(
    "base64",
  );

  // Ticket Tailor API uses form-urlencoded for POST bodies
  const params = new URLSearchParams({
    full_name: name,
    email,
    event_id: TICKET_TAILOR_EVENT_ID,
    ticket_type_id: TICKET_TAILOR_TICKET_TYPE_ID,
    quantity: quantity.toString(),
  });

  if (phone) {
    params.set("phone", phone);
  }

  try {
    const response = await fetch(
      "https://api.tickettailor.com/v1/issued_tickets",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Ticket Tailor error (${response.status}):`,
        errorBody,
      );
    } else {
      const ticket = await response.json();
      console.log(
        "Ticket Tailor: ticket issued successfully",
        ticket.id,
        "for",
        email,
      );
    }
  } catch (error) {
    console.error("Ticket Tailor network error:", error);
  }
}

/**
 * Ensures a contact exists in EmailOctopus. Called from webhook as a fallback
 * in case the registration step failed to add them.
 */
async function ensureEmailOctopusContact(email: string, name: string) {
  try {
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
          fields: { Name: name },
          status: "SUBSCRIBED",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("MEMBER_EXISTS_WITH_EMAIL_ADDRESS")) {
        console.log("EmailOctopus: contact already exists for", email);
      } else {
        console.error("EmailOctopus webhook error:", errorText);
      }
    } else {
      console.log("EmailOctopus: contact confirmed for", email);
    }
  } catch (error) {
    console.error("EmailOctopus webhook error (non-fatal):", error);
  }
}
