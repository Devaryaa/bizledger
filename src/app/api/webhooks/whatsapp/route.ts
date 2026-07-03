import { NextResponse } from "next/server";

// PHASE 4 — WhatsApp Business Cloud API webhook. Verification (GET) works
// once WHATSAPP_VERIFY_TOKEN is set. Message handling (POST) is intentionally
// left as a TODO: it should normalize the inbound payload into the same
// { chatId, text } shape used by src/lib/bots/telegram.ts, then call the
// Phase 3 parser chain (ruleParser -> llmParser) and createTransaction()
// directly — no new parsing logic needed, only a new adapter.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "WhatsApp not configured (Phase 4)" }, { status: 501 });
  }
  // TODO (Phase 4): parse req.body per WhatsApp Cloud API message schema,
  // extract { from, text }, then reuse lib/nlp/ruleParser.ts + llmParser.ts
  // and lib/services/transactionService.ts exactly as the Telegram webhook does.
  return NextResponse.json({ ok: true });
}
