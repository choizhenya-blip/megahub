/**
 * Trello webhook handler.
 *
 * Sends a Telegram notification on every card list change, showing:
 *   - card name
 *   - previous list → new list
 *   - who moved the card (Trello member)
 *
 * Trello sends HEAD on webhook registration (must return 200),
 * then POST for each action.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendCardMovedNotification } from "@/lib/telegram";

// ── Trello payload types ──────────────────────────────────────

interface TrelloMember {
  fullName: string;
  username: string;
}

interface TrelloCard {
  name: string;
  shortLink: string;
}

interface TrelloList {
  id: string;
  name: string;
}

interface TrelloActionData {
  card: TrelloCard;
  listAfter?: TrelloList;
  listBefore?: TrelloList;
}

interface TrelloAction {
  type: string;
  memberCreator: TrelloMember;
  data: TrelloActionData;
}

interface TrelloWebhookPayload {
  action: TrelloAction;
}

// ── Helpers ───────────────────────────────────────────────────

function trelloCardUrl(shortLink: string): string {
  return `https://trello.com/c/${shortLink}`;
}

// ── HTTP handlers ─────────────────────────────────────────────

/**
 * Trello sends HEAD to verify the callback URL during webhook registration.
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return new NextResponse("OK", { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: TrelloWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = payload?.action;
  if (!action) {
    return NextResponse.json({ ok: true });
  }

  // Only notify on card moves (listAfter present means the list changed)
  if (action.type !== "updateCard" || !action.data.listAfter || !action.data.listBefore) {
    return NextResponse.json({ ok: true });
  }

  const listBefore = action.data.listBefore.name;
  const listAfter  = action.data.listAfter.name;
  const cardName   = action.data.card.name;
  const cardUrl    = trelloCardUrl(action.data.card.shortLink);
  const movedBy    = action.memberCreator?.fullName || action.memberCreator?.username || "Неизвестно";

  console.log(`[trello-webhook] "${cardName}": "${listBefore}" → "${listAfter}" by ${movedBy}`);

  try {
    await sendCardMovedNotification({ cardName, cardUrl, listBefore, listAfter, movedBy });
  } catch (err) {
    console.error("[trello-webhook] ⚠️  Telegram notification failed:", err);
    // Non-fatal — always return 200 so Trello doesn't disable the webhook
  }

  return NextResponse.json({ ok: true });
}
