import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.EMAIL_OCTOPUS_API_KEY;
  const listId = process.env.EMAIL_OCTOPUS_LIST_ID;

  if (!apiKey || !listId || apiKey.includes("REPLACE") || listId.includes("REPLACE")) {
    return NextResponse.json(
      { error: "EmailOctopus API key or List ID is not configured." },
      { status: 400 }
    );
  }

  try {
    // Fetch contacts from EmailOctopus API
    // https://emailoctopus.com/api/1.6/lists/:listId/contacts
    const response = await fetch(
      `https://emailoctopus.com/api/1.6/lists/${listId}/contacts?api_key=${apiKey}&limit=100`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't cache to ensure we get the latest data
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("EmailOctopus API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch attendees from EmailOctopus." },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Map the EmailOctopus data to a simpler structure for our frontend
    const attendees = data.data.map((contact: any) => ({
      id: contact.id,
      email: contact.email_address,
      firstName: contact.fields?.FirstName || "",
      lastName: contact.fields?.LastName || "",
      message: contact.fields?.Message || "",
      status: contact.status, // e.g. "SUBSCRIBED"
      createdAt: contact.created_at,
    }));

    // Sort by most recent first
    attendees.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json(
      { error: "Internal server error fetching attendees." },
      { status: 500 }
    );
  }
}
