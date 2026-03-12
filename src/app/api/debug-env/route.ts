import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ?? null,
    TELEGRAM_TOPIC_B2C: process.env.TELEGRAM_TOPIC_B2C ?? null,
    TELEGRAM_TOPIC_B2BG: process.env.TELEGRAM_TOPIC_B2BG ?? null,
  });
}
