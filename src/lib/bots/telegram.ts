// PHASE 2/3 — Telegram bot.
// Activate by setting TELEGRAM_BOT_TOKEN and wiring the webhook route at
// src/app/api/webhooks/telegram/route.ts to call handleTelegramMessage().
//
// Phase 2 ships with a simple structured-command parser (parseCommand below).
// Phase 3 swaps it for src/lib/nlp/ruleParser.ts + llmParser.ts — the call
// to createTransaction() at the bottom never changes.

import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/services/transactionService";

interface TelegramMessage {
  chatId: string;
  text: string;
}

// Phase 2 baseline parser: "Expense 500 Tea" / "Received 15000 Rahul"
function parseCommand(text: string): { type: "EXPENSE" | "INCOME"; amount: number; description: string } | null {
  const match = text.trim().match(/^(expense|received|deposit)\s+(\d+(?:\.\d+)?)\s*(.*)$/i);
  if (!match) return null;
  const [, verb, amountStr, rest] = match;
  const type = verb.toLowerCase() === "expense" ? "EXPENSE" : "INCOME";
  return { type, amount: Number(amountStr), description: rest.trim() };
}

export async function handleTelegramMessage(msg: TelegramMessage): Promise<string> {
  const user = await prisma.user.findUnique({ where: { telegramChatId: msg.chatId } });
  if (!user) {
    return "Your Telegram account isn't linked yet. Ask an admin to add your chat ID in the Users page.";
  }

  // Phase 3: try ruleParser/llmParser first; if confidence is low, write to
  // PendingMessage and ask a clarifying question instead of guessing.
  const parsed = parseCommand(msg.text);
  if (!parsed) {
    await prisma.pendingMessage.create({
      data: { source: "TELEGRAM", rawMessage: msg.text, senderId: msg.chatId },
    });
    return `Couldn't understand that. Try: "Expense 500 Tea" or "Received 15000 Rahul"`;
  }

  // Default to the user's first business until business-detection (Phase 3) is added.
  const business = await prisma.business.findFirst({ where: { isActive: true } });
  if (!business) return "No active business configured.";

  const transaction = await createTransaction({
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description || undefined,
    businessId: business.id,
    enteredById: user.id,
    source: "TELEGRAM",
    rawMessage: msg.text,
  });

  return `Saved: ${parsed.type === "EXPENSE" ? "₹" + parsed.amount + " expense" : "₹" + parsed.amount + " received"} (#${transaction.id.slice(0, 8)})`;
}
