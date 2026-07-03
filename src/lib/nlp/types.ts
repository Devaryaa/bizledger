// This type is the contract between "any inbound channel" and the
// transaction service. Phase 2's Telegram bot fills this in from a
// structured command. Phase 3's NLP parser fills it from free text.
// Phase 4's WhatsApp adapter reuses it unchanged.

export interface ParsedTransactionDraft {
  type: "EXPENSE" | "INCOME";
  amount: number;
  description?: string;
  categoryHint?: string; // matched against Category.name
  customerName?: string; // matched/created against Customer
  supplierName?: string;
  businessHint?: string; // "wholesale" | "retail" | business name
  confidence: number; // 0-1, used to decide auto-save vs. ask-for-clarification
}
