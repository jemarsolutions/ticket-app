import { NextResponse } from "next/server";

/**
 * GET /api/admin/status
 * Returns which integrations are configured (env vars present).
 * Never returns the actual key values — only whether they are set.
 */
export async function GET() {
  const ticketTailorConfigured = !!(
    process.env.TICKET_TAILOR_API_KEY &&
    process.env.TICKET_TAILOR_API_KEY !== "REPLACE_WITH_YOUR_TICKET_TAILOR_API_KEY" &&
    process.env.TICKET_TAILOR_EVENT_ID &&
    process.env.TICKET_TAILOR_EVENT_ID !== "ev_REPLACE_WITH_YOUR_EVENT_ID" &&
    process.env.TICKET_TAILOR_TICKET_TYPE_ID &&
    process.env.TICKET_TAILOR_TICKET_TYPE_ID !== "tt_REPLACE_WITH_YOUR_TICKET_TYPE_ID"
  );

  const emailOctopusConfigured = !!(
    process.env.EMAIL_OCTOPUS_API_KEY &&
    process.env.EMAIL_OCTOPUS_API_KEY !== "REPLACE_WITH_YOUR_EMAIL_OCTOPUS_API_KEY" &&
    process.env.EMAIL_OCTOPUS_LIST_ID &&
    process.env.EMAIL_OCTOPUS_LIST_ID !== "REPLACE_WITH_YOUR_LIST_ID"
  );

  return NextResponse.json({
    ticketTailor: {
      configured: ticketTailorConfigured,
      eventId: process.env.TICKET_TAILOR_EVENT_ID || null,
      ticketTypeId: process.env.TICKET_TAILOR_TICKET_TYPE_ID || null,
    },
    emailOctopus: {
      configured: emailOctopusConfigured,
      listId: process.env.EMAIL_OCTOPUS_LIST_ID || null,
    },
    app: {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      eventName: process.env.NEXT_PUBLIC_EVENT_NAME || "Birthday Party",
      eventDate: process.env.NEXT_PUBLIC_EVENT_DATE || "Not set",
      eventLocation: process.env.NEXT_PUBLIC_EVENT_LOCATION || "Not set",
      ticketPriceCents: parseInt(
        process.env.NEXT_PUBLIC_TICKET_PRICE_CENTS || "1000",
        10,
      ),
    },
  });
}
