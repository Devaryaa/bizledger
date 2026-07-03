import { ParsedTransactionDraft } from "./types";

// PHASE 3 — not active in Phase 1/2. Kept here so the interface is fixed
// from the start: takes raw text, returns a draft + confidence score.
// Phase 2's bot can call this once it's implemented; until then the bot
// uses a simple "Expense <amount> <text>" command parser instead.

const INCOME_WORDS = ["received", "deposit", "got", "collected", "cash sale"];
const EXPENSE_WORDS = ["expense", "spent", "paid", "bought"];

export function parseWithRules(rawText: string): ParsedTransactionDraft | null {
  const text = rawText.toLowerCase().trim();
  const amountMatch = text.match(/(\d+[,.]?\d*)/);
  if (!amountMatch) return null;

  const amount = Number(amountMatch[1].replace(/,/g, ""));
  const isIncome = INCOME_WORDS.some((w) => text.includes(w));
  const isExpense = EXPENSE_WORDS.some((w) => text.includes(w));

  if (!isIncome && !isExpense) return null;

  const description = text
    .replace(amountMatch[1], "")
    .replace(/(expense|spent|paid|bought|received|deposit|got|collected|₹|rs\.?)/g, "")
    .trim();

  return {
    type: isIncome ? "INCOME" : "EXPENSE",
    amount,
    description: description || undefined,
    confidence: isIncome || isExpense ? 0.75 : 0.4,
  };
}
