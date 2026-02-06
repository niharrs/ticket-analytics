import { google } from "googleapis";
import { config } from "../config.js";
import { supabase } from "../db/supabase.js";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  if (!config.google.sheetId) return null;

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({
      version: "v4",
      auth,
    });

    return sheetsClient;
  } catch (err) {
    console.warn("Google Sheets not configured:", (err as Error).message);
    return null;
  }
}


export async function syncTicketToSheet(ticketId: string): Promise<boolean> {
  const sheets = getSheetsClient();
  if (!sheets) {
    console.log("  Google Sheets not configured, skipping sync");
    return false;
  }

  // Fetch full ticket data with categories
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    console.warn("Failed to fetch ticket for sheet sync:", error?.message);
    return false;
  }

  // Fetch categories for this ticket
  const { data: ticketCats } = await supabase
    .from("ticket_categories")
    .select("category_id, categories(name)")
    .eq("ticket_id", ticketId);

  const categoryNames = (ticketCats || [])
    .map((tc: Record<string, unknown>) => {
      const cat = tc.categories as { name: string } | null;
      return cat?.name;
    })
    .filter(Boolean)
    .join(", ");

  // Fetch insights
  const { data: insights } = await supabase
    .from("insights")
    .select("insight_text, insight_type")
    .eq("ticket_id", ticketId);

  const insightsSummary = (insights || [])
    .map((i: { insight_text: string; insight_type: string }) => `[${i.insight_type}] ${i.insight_text}`)
    .join("; ");

  const row = [
    ticket.discord_message_id,
    ticket.discord_posted_at || "",
    ticket.summary || "",
    categoryNames,
    ticket.severity || "",
    ticket.resolved ? "Yes" : "No",
    ticket.sentiment || "",
    String(ticket.participant_count || 0),
    String(ticket.message_count || 0),
    insightsSummary,
    ticket.transcript_url || "",
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.google.sheetId,
      range: "Sheet1!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    // Update sheets_synced_at
    await supabase
      .from("tickets")
      .update({ sheets_synced_at: new Date().toISOString() })
      .eq("id", ticketId);

    console.log(`  Synced ticket to Google Sheet`);
    return true;
  } catch (err) {
    console.error("Google Sheets sync failed:", (err as Error).message);
    return false;
  }
}

export async function ensureSheetHeaders(): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets) return;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: "Sheet1!A1:K1",
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A1:K1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            "Message ID", "Posted At", "Summary", "Categories",
            "Severity", "Resolved", "Sentiment", "Participants",
            "Messages", "Insights", "Transcript URL"
          ]],
        },
      });
      console.log("Sheet headers created");
    }
  } catch (err) {
    console.warn("Could not check/set sheet headers:", (err as Error).message);
  }
}
