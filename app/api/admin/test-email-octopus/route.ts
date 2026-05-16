import { NextResponse } from "next/server";

/**
 * POST /api/admin/test-email-octopus
 * Tests the EmailOctopus connection by fetching the list details.
 * This is a READ-only test — it does not add or modify contacts.
 */
export async function POST() {
  const apiKey = process.env.EMAIL_OCTOPUS_API_KEY;
  const listId = process.env.EMAIL_OCTOPUS_LIST_ID;

  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_EMAIL_OCTOPUS_API_KEY") {
    return NextResponse.json(
      {
        success: false,
        error: "EMAIL_OCTOPUS_API_KEY is not configured in .env.local",
      },
      { status: 400 },
    );
  }

  if (!listId || listId === "REPLACE_WITH_YOUR_LIST_ID") {
    return NextResponse.json(
      {
        success: false,
        error: "EMAIL_OCTOPUS_LIST_ID is not configured in .env.local",
      },
      { status: 400 },
    );
  }

  try {
    // Test connection by fetching the list details
    const response = await fetch(
      `https://emailoctopus.com/api/1.6/lists/${listId}?api_key=${apiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `EmailOctopus API returned ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 },
      );
    }

    const list = await response.json();

    return NextResponse.json({
      success: true,
      list: {
        id: list.id,
        name: list.name,
        subscriberCount: list.counts?.subscribed || 0,
        unsubscribedCount: list.counts?.unsubscribed || 0,
        pendingCount: list.counts?.pending || 0,
      },
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
