/**
 * Trello webhook handler.
 *
 * Listens for card movements and sends Telegram notifications when
 * a card enters the "invoice" or "closed" list.
 *
 * Setup:
 *   1. Register a Trello webhook pointing to https://yourdomain.com/api/trello-webhook
 *      curl -s -X POST "https://api.trello.com/1/webhooks" \
 *        -d "key=YOUR_TRELLO_KEY&token=YOUR_TRELLO_TOKEN" \
 *        -d "callbackURL=https://yourdomain.com/api/trello-webhook" \
 *        -d "idModel=YOUR_BOARD_ID" \
 *        -d "description=MegaHub board"
 *
 * Required env vars (set in .env.local):
 *   TRELLO_INVOICE_LIST_NAME — Trello list name that means "invoice formed"
 *                              (default: "Счёт выставлен")
 *   TRELLO_CLOSED_LIST_NAME  — Trello list name that means "order closed"
 *                              (default: "Закрыто")
 */

import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceNotification, sendOrderClosedNotification } from "@/lib/telegram";

// ── Trello action types ──────────────────────────────────────

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
  data: TrelloActionData;
}

interface TrelloWebhookPayload {
  action: TrelloAction;
}

// ── Config ───────────────────────────────────────────────────

const INVOICE_LIST = () =>
  process.env.TRELLO_INVOICE_LIST_NAME ?? "Счёт выставлен";

const CLOSED_LIST = () =>
  process.env.TRELLO_CLOSED_LIST_NAME ?? "Закрыто";

function trelloCardUrl(shortLink: string): string {
  return `https://trello.com/c/${shortLink}`;
}

// ── Handlers ─────────────────────────────────────────────────

/**
 * Trello sends a HEAD/GET request to verify the webhook URL.
 * Must respond with 200.
 */
export async function GET(): Promise<NextResponse> {
  return new NextResponse("OK", { status: 200 });
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
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

  // We only care about card moves
  if (action.type !== "updateCard" || !action.data.listAfter) {
    return NextResponse.json({ ok: true });
  }

  const listName = action.data.listAfter.name;
  const cardName = action.data.card.name;
  const cardUrl  = trelloCardUrl(action.data.card.shortLink);

  console.log(`[trello-webhook] Card "${cardName}" moved to list "${listName}"`);

  try {
    if (listName === INVOICE_LIST()) {
      await sendInvoiceNotification(cardName, cardUrl);
    } else if (listName === CLOSED_LIST()) {
      await sendOrderClosedNotification(cardName, cardUrl);
    }
  } catch (err) {
    console.error("[trello-webhook] ⚠️  Telegram notification failed:", err);
    // Non-fatal — still return 200 so Trello doesn't retry
  }

  return NextResponse.json({ ok: true });
}
