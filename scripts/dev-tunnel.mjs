/**
 * Dev tunnel script.
 *
 * Usage:
 *   node scripts/dev-tunnel.mjs
 *
 * What it does:
 *   1. Opens a localtunnel to localhost:3000
 *   2. Prints the public URL
 *   3. Registers (or updates) a Trello webhook pointing to that URL
 *   4. Keeps running until Ctrl+C
 *
 * Required in .env.local:
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID
 */

import localtunnel from "localtunnel";
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
  // rely on shell env
}

const TRELLO_API_KEY  = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN    = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;

// ── Register / update webhook ────────────────────────────────

async function registerWebhook(appUrl) {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
    console.log("⚠️  TRELLO_API_KEY / TRELLO_TOKEN / TRELLO_BOARD_ID not set — skipping webhook registration.");
    return;
  }

  const callbackURL = `${appUrl}/api/trello-webhook`;
  const base = `https://api.trello.com/1`;
  const auth = `key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

  // Delete existing webhooks for this board+token to avoid duplicates
  const listRes = await fetch(`${base}/tokens/${TRELLO_TOKEN}/webhooks?${auth}`).catch(() => null);
  if (listRes?.ok) {
    const existing = await listRes.json();
    for (const w of existing) {
      if (w.idModel === TRELLO_BOARD_ID) {
        await fetch(`${base}/webhooks/${w.id}?${auth}`, { method: "DELETE" }).catch(() => null);
        console.log(`🗑️  Removed old webhook: ${w.callbackURL}`);
      }
    }
  }

  // Register new webhook
  const res = await fetch(`${base}/webhooks?${auth}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idModel:     TRELLO_BOARD_ID,
      callbackURL,
      description: "MegaHub dev (localtunnel)",
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ Trello webhook registered:`);
    console.log(`   ID:       ${data.id}`);
    console.log(`   Callback: ${callbackURL}`);
  } else {
    const err = await res.text();
    console.error(`❌ Webhook registration failed: ${res.status} ${err}`);
  }
}

// ── Main ─────────────────────────────────────────────────────

console.log("🌐 Opening tunnel to localhost:3000...\n");

const tunnel = await localtunnel({ port: 3000 });

console.log(`🔗 Public URL: ${tunnel.url}\n`);
console.log(`📡 Webhook endpoint: ${tunnel.url}/api/trello-webhook\n`);

await registerWebhook(tunnel.url);

console.log(`\n✅ Tunnel is active. Make sure Next.js is running: npm run dev`);
console.log(`   Press Ctrl+C to stop.\n`);

tunnel.on("close", () => {
  console.log("\n🔌 Tunnel closed.");
  process.exit(0);
});

// Keep alive
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down tunnel...");
  tunnel.close();
});
