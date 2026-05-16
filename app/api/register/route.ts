import { NextRequest, NextResponse } from "next/server";

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

    // Instead of Stripe, we will redirect the user to the Ticket Tailor event checkout page.
    const TICKET_TAILOR_API_KEY = process.env.TICKET_TAILOR_API_KEY || "";
    const TICKET_TAILOR_EVENT_ID = process.env.TICKET_TAILOR_EVENT_ID || "";
    let checkoutUrl = "";

    if (TICKET_TAILOR_API_KEY && TICKET_TAILOR_EVENT_ID) {
      try {
        // Fetch event details from Ticket Tailor to get the real checkout URL
        const response = await fetch(
          `https://api.tickettailor.com/v1/events/${TICKET_TAILOR_EVENT_ID}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Basic ${Buffer.from(TICKET_TAILOR_API_KEY + ":").toString("base64")}`,
            },
          }
        );

        if (response.ok) {
          const eventData = await response.json();
          if (eventData.checkout_url) {
            checkoutUrl = eventData.checkout_url;
          }
        } else {
          console.error("Failed to fetch Ticket Tailor event:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Ticket Tailor:", err);
      }
    }

    // Fallback if we couldn't fetch the URL via API
    if (!checkoutUrl) {
      if (TICKET_TAILOR_EVENT_ID) {
        // A generic fallback format, might not work depending on the exact event ID format
        checkoutUrl = `https://www.tickettailor.com/checkout/view-event/id/${TICKET_TAILOR_EVENT_ID}`;
      } else {
        // If nothing is configured, just return an error
        return NextResponse.json(
          { error: "Ticket Tailor event is not fully configured." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      redirectUrl: checkoutUrl,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
