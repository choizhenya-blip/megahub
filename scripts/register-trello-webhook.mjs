/**
 * One-time script to register a Trello webhook.
 *
 * Usage:
 *   node scripts/register-trello-webhook.mjs
 *
 * Required env vars (in .env.local or shell):
 *   TRELLO_API_KEY   — from https://trello.com/app-key
 *   TRELLO_TOKEN     — from https://trello.com/app-key (click "Generate a token")
 *   TRELLO_BOARD_ID  — last part of your board URL:
 *                      https://trello.com/b/BOARD_ID/board-name
 *   APP_URL          — your deployed URL, e.g. https://megahub.vercel.app
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ──────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on shell env vars
}

// ── Validate ─────────────────────────────────────────────────

const TRELLO_API_KEY  = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN    = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;
const APP_URL         = process.env.APP_URL;

const missing = [
  !TRELLO_API_KEY  && "TRELLO_API_KEY",
  !TRELLO_TOKEN    && "TRELLO_TOKEN",
  !TRELLO_BOARD_ID && "TRELLO_BOARD_ID",
  !APP_URL         && "APP_URL",
].filter(Boolean);

if (missing.length) {
  console.error("❌ Missing env vars:", missing.join(", "));
  console.error("\nAdd them to .env.local:\n");
  console.error("  TRELLO_API_KEY=<key from https://trello.com/app-key>");
  console.error("  TRELLO_TOKEN=<token from the same page>");
  console.error("  TRELLO_BOARD_ID=<last segment of your board URL>");
  console.error("  APP_URL=https://your-app.vercel.app");
  process.exit(1);
}

const callbackURL = `${APP_URL}/api/trello-webhook`;

// ── Check existing webhooks ───────────────────────────────────

console.log("🔍 Checking existing webhooks for this token...\n");

const listRes = await fetch(
  `https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
);

if (listRes.ok) {
  const existing = await listRes.json();
  const dupe = existing.find(
    (w) => w.idModel === TRELLO_BOARD_ID && w.callbackURL === callbackURL
  );
  if (dupe) {
    console.log("✅ Webhook already registered:");
    console.log(`   ID:          ${dupe.id}`);
    console.log(`   Board:       ${dupe.idModel}`);
    console.log(`   Callback:    ${dupe.callbackURL}`);
    console.log(`   Active:      ${dupe.active}`);
    process.exit(0);
  }
}

// ── Register ──────────────────────────────────────────────────

console.log(`📡 Registering webhook...`);
console.log(`   Board ID:    ${TRELLO_BOARD_ID}`);
console.log(`   Callback:    ${callbackURL}\n`);

const res = await fetch(
  `https://api.trello.com/1/webhooks?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idModel:     TRELLO_BOARD_ID,
      callbackURL,
      description: "MegaHub — Telegram notifications",
    }),
  }
);

const data = await res.json();

if (!res.ok) {
  console.error("❌ Failed to register webhook:");
  console.error(JSON.stringify(data, null, 2));
  console.error(
    "\nMake sure APP_URL is publicly accessible (not localhost)."
  );
  process.exit(1);
}

console.log("✅ Webhook registered successfully!");
console.log(`   ID:       ${data.id}`);
console.log(`   Active:   ${data.active}`);
console.log(`\nFrom now on, every card move in Trello will send a Telegram notification.`);
