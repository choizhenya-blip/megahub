#!/usr/bin/env node
/**
 * register-trello-webhook.mjs
 * Registers the Trello webhook for the production Vercel URL.
 *
 * Usage: node scripts/register-trello-webhook.mjs
 *
 * Required in .env.local:
 *   TRELLO_API_KEY   — from https://trello.com/app-key
 *   TRELLO_TOKEN     — "Generate a Token" on the same page
 *   TRELLO_BOARD_ID  — from board URL: trello.com/b/BOARD_ID/...
 *   APP_URL          — e.g. https://megahub.vercel.app
 */

import { readFileSync } from "fs";
import { resolve } from "path";

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

const env = loadEnv();
const apiKey = env.TRELLO_API_KEY;
const token = env.TRELLO_TOKEN;
const boardId = env.TRELLO_BOARD_ID;
const appUrl = env.APP_URL;

// ── Validate ──────────────────────────────────────────────────

const missing = [];
if (!apiKey) missing.push("TRELLO_API_KEY");
if (!token)  missing.push("TRELLO_TOKEN");
if (!boardId) missing.push("TRELLO_BOARD_ID");
if (!appUrl)  missing.push("APP_URL");

if (missing.length) {
  console.error("❌ Missing in .env.local:", missing.join(", "));
  console.log("\nAdd these to .env.local:");
  if (!apiKey)  console.log("  TRELLO_API_KEY=...   # https://trello.com/app-key");
  if (!token)   console.log("  TRELLO_TOKEN=...     # Generate a Token on the same page");
  if (!boardId) console.log("  TRELLO_BOARD_ID=...  # from board URL: trello.com/b/BOARD_ID/...");
  if (!appUrl)  console.log("  APP_URL=...          # e.g. https://megahub.vercel.app");
  process.exit(1);
}

// ── Resolve short board ID → full 24-char ID ─────────────────

console.log("🔗 Registering Trello webhook...");
console.log(`   Board (short): ${boardId}`);

const boardRes = await fetch(
  `https://api.trello.com/1/boards/${boardId}?fields=id&key=${apiKey}&token=${token}`
);
if (!boardRes.ok) {
  console.error("❌ Could not resolve board ID:", await boardRes.text());
  process.exit(1);
}
const fullBoardId = (await boardRes.json()).id;
console.log(`   Board (full) : ${fullBoardId}`);

const callbackUrl = `${appUrl}/api/trello-webhook`;
console.log(`   Callback     : ${callbackUrl}`);

// ── Delete old webhooks for this board ────────────────────────

const listRes = await fetch(
  `https://api.trello.com/1/tokens/${token}/webhooks?key=${apiKey}&token=${token}`
);
const existing = await listRes.json();

for (const wh of Array.isArray(existing) ? existing : []) {
  if (wh.idModel === fullBoardId) {
    await fetch(`https://api.trello.com/1/webhooks/${wh.id}?key=${apiKey}&token=${token}`, {
      method: "DELETE",
    });
    console.log(`  🗑️  Deleted old webhook: ${wh.callbackURL}`);
  }
}

// ── Register new webhook ──────────────────────────────────────

const createRes = await fetch(
  `https://api.trello.com/1/webhooks?key=${apiKey}&token=${token}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "MegaHub board webhook",
      callbackURL: callbackUrl,
      idModel: fullBoardId,
    }),
  }
);

if (createRes.ok) {
  const wh = await createRes.json();
  console.log(`\n✅ Done!`);
  console.log(`   Webhook ID  : ${wh.id}`);
  console.log(`   Callback URL: ${wh.callbackURL}`);
} else {
  console.error(`\n❌ Failed:`, await createRes.text());
  process.exit(1);
}
