import { NextResponse } from "next/server";
import { handleTelegramMessage } from "@/lib/bots/telegram";

// PHASE 2/3 — point your Telegram bot's webhook at
// https://<your-domain>/api/webhooks/telegram and set TELEGRAM_BOT_TOKEN
// and TELEGRAM_WEBHOOK_SECRET in the environment. This route is inert
// (returns 501) until those env vars are present, so Phase 1 deploys safely
// without a bot configured.

export async function POST(req: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Telegram bot not configured (Phase 2)" }, { status: 501 });
  }

  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const update = await req.json();
  const text = update?.message?.text;
  const chatId = update?.message?.chat?.id?.toString();
  if (!text || !chatId) return NextResponse.json({ ok: true });

  const reply = await handleTelegramMessage({ chatId, text });

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: reply }),
  });

  return NextResponse.json({ ok: true });
}
