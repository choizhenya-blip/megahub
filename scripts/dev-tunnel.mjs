#!/usr/bin/env node
/**
 * dev-tunnel.mjs
 * Opens a localtunnel to localhost:3000, then registers (or re-registers)
 * the Trello webhook to point at the tunnel URL.
 *
 * Usage: npm run tunnel   (run in a separate terminal while "npm run dev" is running)
 */

import localtunnel from "localtunnel";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Parse .env.local ─────────────────────────────────────────

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

// ── Trello helpers ────────────────────────────────────────────

async function deleteOldWebhooks(apiKey, token, boardId) {
  const res = await fetch(
    `https://api.trello.com/1/tokens/${token}/webhooks?key=${apiKey}&token=${token}`
  );
  if (!res.ok) return;
  const list = await res.json();
  for (const wh of Array.isArray(list) ? list : []) {
    if (wh.idModel === boardId) {
      await fetch(`https://api.trello.com/1/webhooks/${wh.id}?key=${apiKey}&token=${token}`, {
        method: "DELETE",
      });
      console.log(`  🗑️  Deleted old webhook: ${wh.callbackURL}`);
    }
  }
}

async function registerWebhook(apiKey, token, boardId, callbackUrl) {
  const res = await fetch(
    `https://api.trello.com/1/webhooks?key=${apiKey}&token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "MegaHub dev tunnel webhook",
        callbackURL: callbackUrl,
        idModel: boardId,
      }),
    }
  );
  if (res.ok) {
    const wh = await res.json();
    console.log(`✅ Webhook registered: ${wh.callbackURL}`);
  } else {
    console.error(`❌ Failed to register webhook:`, await res.text());
  }
}

// ── Main ──────────────────────────────────────────────────────

const env = loadEnv();
const PORT = 3000;

console.log(`🚇 Opening tunnel to localhost:${PORT}...`);
const tunnel = await localtunnel({ port: PORT });
const tunnelUrl = tunnel.url;
console.log(`✅ Tunnel URL: ${tunnelUrl}\n`);

const { TRELLO_API_KEY: apiKey, TRELLO_TOKEN: token, TRELLO_BOARD_ID: boardId } = env;

if (!apiKey || !token || !boardId) {
  console.warn("⚠️  TRELLO_API_KEY / TRELLO_TOKEN / TRELLO_BOARD_ID not set in .env.local");
  console.log("   Webhook not registered. Tunnel is still active for manual testing.");
} else {
  const callbackUrl = `${tunnelUrl}/api/trello-webhook`;
  console.log("🔗 Registering Trello webhook...");
  await deleteOldWebhooks(apiKey, token, boardId);
  await registerWebhook(apiKey, token, boardId, callbackUrl);
}

console.log("\n📡 Tunnel active. Press Ctrl+C to stop.\n");

tunnel.on("close", () => {
  console.log("Tunnel closed.");
  process.exit(0);
});
