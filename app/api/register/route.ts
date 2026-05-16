import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const EMAIL_OCTOPUS_API_KEY = process.env.EMAIL_OCTOPUS_API_KEY || "";
const EMAIL_OCTOPUS_LIST_ID = process.env.EMAIL_OCTOPUS_LIST_ID || "";

const TICKET_PRICE_CENTS = parseInt(
  process.env.NEXT_PUBLIC_TICKET_PRICE_CENTS || "1000",
  10,
);
const EVENT_NAME =
  process.env.NEXT_PUBLIC_EVENT_NAME || "Birthday Party";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, numberOfTickets } = body;

    // Validate input
    if (!name || !email || !numberOfTickets) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 1: Add email to EmailOctopus immediately (user expressed interest)
    // This is safe to do before payment — we're just adding them to the mailing list
    if (EMAIL_OCTOPUS_API_KEY && EMAIL_OCTOPUS_LIST_ID) {
      await addToEmailOctopus(email, name);
    }

    // Step 2: Create Stripe checkout session
    // Ticket Tailor ticket is NOT created here — it's created in the Stripe webhook
    // AFTER payment is confirmed, so we never issue tickets for failed payments
    const session = await createStripeSession(
      email,
      name,
      numberOfTickets,
      phone,
    );

    return NextResponse.json({
      redirectUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}

async function addToEmailOctopus(email: string, name: string) {
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
          fields: {
            Name: name,
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

async function createStripeSession(
  email: string,
  name: string,
  numberOfTickets: number,
  phone?: string,
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${EVENT_NAME} Ticket`,
            description: `${numberOfTickets} ticket${numberOfTickets > 1 ? "s" : ""} for ${EVENT_NAME}`,
          },
          unit_amount: TICKET_PRICE_CENTS,
        },
        quantity: numberOfTickets,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?cancelled=true`,
    customer_email: email,
    // Store user data in metadata so the webhook can use it
    metadata: {
      name,
      email,
      phone: phone || "",
      numberOfTickets: numberOfTickets.toString(),
    },
  });

  return session;
}
