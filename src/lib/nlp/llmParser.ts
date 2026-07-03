import { ParsedTransactionDraft } from "./types";

// PHASE 3 — not active in Phase 1/2. Called only when parseWithRules()
// returns null or low confidence. Uses Claude's Messages API with a
// structured-output prompt to extract amount/type/category/customer
// from free-form text like "We received 75k from Rahul today."
//
// Implementation deferred to Phase 3: requires ANTHROPIC_API_KEY env var.
// Interface is fixed now so the bot wiring (Phase 2) never has to change.

export async function parseWithLlm(rawText: string): Promise<ParsedTransactionDraft | null> {
  throw new Error(
    "parseWithLlm is a Phase 3 feature. Implement using the Anthropic Messages API " +
      "with a JSON-only system prompt once ANTHROPIC_API_KEY is configured."
  );
}
