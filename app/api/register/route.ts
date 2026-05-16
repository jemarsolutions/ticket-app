import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || ""); // no api version needed

const TICKET_TAILOR_API_KEY = process.env.TICKET_TAILOR_API_KEY || "";
const TICKET_TAILOR_EVENT_ID = process.env.TICKET_TAILOR_EVENT_ID || "";
const EMAIL_OCTOPUS_API_KEY = process.env.EMAIL_OCTOPUS_API_KEY || "";
const EMAIL_OCTOPUS_LIST_ID = process.env.EMAIL_OCTOPUS_LIST_ID || "";

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

    // Step 1: Add email to EmailOctopus (or alternative)
    if (EMAIL_OCTOPUS_API_KEY && EMAIL_OCTOPUS_LIST_ID) {
      await addToEmailOctopus(email, name);
    }

    // Step 2: Create Stripe checkout session
    const session = await createStripeSession(
      email,
      name,
      numberOfTickets,
      phone,
    );

    // Step 3: Optionally create ticket in Ticket Tailor (can also be done via webhook)
    if (TICKET_TAILOR_API_KEY && TICKET_TAILOR_EVENT_ID) {
      await createTicketTailorTicket(name, email, phone, numberOfTickets);
    }

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
      `https://api.emailoctopus.com/api/1.6/lists/${EMAIL_OCTOPUS_LIST_ID}/contacts`,
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
      console.error("EmailOctopus error:", await response.text());
    }
  } catch (error) {
    console.error("EmailOctopus error:", error);
  }
}

async function createStripeSession(
  email: string,
  name: string,
  numberOfTickets: number,
  phone?: string,
) {
  const ticketPrice = 10; // $10 per ticket

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Birthday Party Ticket",
            description: `${numberOfTickets} ticket(s) for the birthday party`,
          },
          unit_amount: ticketPrice * 100,
        },
        quantity: numberOfTickets,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?cancelled=true`,
    customer_email: email,
    metadata: {
      name,
      email,
      phone: phone || "",
      numberOfTickets: numberOfTickets.toString(),
    },
  });

  return session;
}

async function createTicketTailorTicket(
  name: string,
  email: string,
  phone: string | undefined,
  numberOfTickets: number,
) {
  try {
    const response = await fetch(
      `https://api.tickettailor.com/v1/events/${TICKET_TAILOR_EVENT_ID}/tickets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          quantity: numberOfTickets,
        }),
      },
    );

    if (!response.ok) {
      console.error("Ticket Tailor error:", await response.text());
    }
  } catch (error) {
    console.error("Ticket Tailor error:", error);
  }
}
