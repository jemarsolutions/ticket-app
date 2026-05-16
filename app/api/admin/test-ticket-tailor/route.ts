import { NextResponse } from "next/server";

/**
 * POST /api/admin/test-ticket-tailor
 * Tests the Ticket Tailor connection by listing ticket types for the configured event.
 * This is a READ-only test — it does not create any tickets.
 */
export async function POST() {
  const apiKey = process.env.TICKET_TAILOR_API_KEY;
  const eventId = process.env.TICKET_TAILOR_EVENT_ID;

  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_TICKET_TAILOR_API_KEY") {
    return NextResponse.json(
      {
        success: false,
        error: "TICKET_TAILOR_API_KEY is not configured in .env.local",
      },
      { status: 400 },
    );
  }

  if (!eventId || eventId === "ev_REPLACE_WITH_YOUR_EVENT_ID") {
    return NextResponse.json(
      {
        success: false,
        error: "TICKET_TAILOR_EVENT_ID is not configured in .env.local",
      },
      { status: 400 },
    );
  }

  const credentials = Buffer.from(`${apiKey}:`).toString("base64");

  try {
    // Test connection by fetching the event details
    const eventResponse = await fetch(
      `https://api.tickettailor.com/v1/events/${eventId}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      },
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Ticket Tailor API returned ${eventResponse.status}: ${errorText}`,
        },
        { status: 400 },
      );
    }

    const event = await eventResponse.json();

    // Also fetch ticket types for this event
    const ticketTypesResponse = await fetch(
      `https://api.tickettailor.com/v1/ticket_types?event_id=${eventId}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      },
    );

    let ticketTypes = [];
    if (ticketTypesResponse.ok) {
      const ttData = await ticketTypesResponse.json();
      ticketTypes = ttData.data || [];
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        start: event.start,
        status: event.status,
      },
      ticketTypes: ticketTypes.map(
        (tt: { id: string; name: string; quantity_held?: number; quantity_total?: number }) => ({
          id: tt.id,
          name: tt.name,
          quantityHeld: tt.quantity_held,
          quantityTotal: tt.quantity_total,
        }),
      ),
      configuredTicketTypeId:
        process.env.TICKET_TAILOR_TICKET_TYPE_ID || null,
      ticketTypeValid:
        !!process.env.TICKET_TAILOR_TICKET_TYPE_ID &&
        process.env.TICKET_TAILOR_TICKET_TYPE_ID !==
          "tt_REPLACE_WITH_YOUR_TICKET_TYPE_ID" &&
        ticketTypes.some(
          (tt: { id: string }) => tt.id === process.env.TICKET_TAILOR_TICKET_TYPE_ID,
        ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
