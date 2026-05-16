import { NextRequest, NextResponse } from "next/server";

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

    // Capture the email immediately before redirecting to guarantee they are recorded
    if (EMAIL_OCTOPUS_API_KEY && EMAIL_OCTOPUS_LIST_ID) {
      await addToEmailOctopus(email, name);
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
        // Use the user's specific Ticket Tailor event link structure
        checkoutUrl = `https://www.tickettailor.com/events/gaddiesbirthday/${TICKET_TAILOR_EVENT_ID}`;
      } else {
        // Final fallback to the exact provided link
        checkoutUrl = "https://www.tickettailor.com/events/gaddiesbirthday/2219397";
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
