import { NextRequest, NextResponse } from "next/server";
import { sendStatusChangeNotification } from "@/lib/telegram";

// ── Trello sends GET first to verify the endpoint is alive ────
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

// ── Main webhook handler ───────────────────────────────────────
export async function POST(req: NextRequest) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = payload?.action;
  if (!action) {
    return NextResponse.json({ ok: true }); // heartbeat / unknown
  }

  console.log("[trello-webhook] action.type =", action.type);

  // ── Card moved to another list ────────────────────────────
  if (action.type === "updateCard") {
    const data = action.data ?? {};
    const listBefore = data.listBefore?.name as string | undefined;
    const listAfter = data.listAfter?.name as string | undefined;

    // Only care about list changes
    if (!listBefore || !listAfter || listBefore === listAfter) {
      return NextResponse.json({ ok: true });
    }

    const cardName = data.card?.name ?? "Без названия";
    const shortLink = data.card?.shortLink;
    const cardUrl = shortLink
      ? `https://trello.com/c/${shortLink}`
      : "https://trello.com";
    const memberName: string | undefined = action.memberCreator?.fullName;

    console.log(
      `[trello-webhook] Card "${cardName}" moved: "${listBefore}" → "${listAfter}"`,
      memberName ? `by ${memberName}` : ""
    );

    try {
      await sendStatusChangeNotification({ cardName, listBefore, listAfter, memberName, cardUrl });
    } catch (err) {
      console.error("[trello-webhook] ⚠️  Telegram send failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
