# BizLedger — Architecture Document

"Stripe + Notion + WhatsApp for small business bookkeeping"

## 1. Product Phases

| Phase | Deliverable | Depends on |
|---|---|---|
| 1 | Web app: auth, dashboard, transactions, ledgers, cash balance, reports, RBAC | — |
| 2 | Telegram bot writes transactions via the **same API/service layer** as the web app | Phase 1 services |
| 3 | NLP parser layer in front of the Telegram bot (intent + entity extraction, auto-categorization) | Phase 2 ingestion pipeline |
| 4 | WhatsApp Business API adapter reusing the Phase 3 parsing pipeline | Phase 3 parser |

The key architectural decision that makes this phase-safe: **bots never write to the database directly.** Every channel (web form, Telegram, WhatsApp) calls the same internal `TransactionService`. This means Phase 2 needs zero changes to Phase 1's data layer, Phase 3 needs zero changes to Phase 2's bot wiring (it just upgrades the parser the bot calls), and Phase 4 needs zero changes to the parser (it just adds a new inbound adapter).

```
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │   Web UI     │   │ Telegram Bot │   │ WhatsApp Bot │
        │ (forms)      │   │ (webhook)    │   │ (webhook)    │
        └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
               │                  │                   │
               │           ┌──────▼───────┐    (Phase 4 adapter,
               │           │  NLP Parser  │     same parser as
               │           │ (Phase 3)    │     Telegram)
               │           └──────┬───────┘
               │                  │
               └──────────┬───────┘
                           ▼
                ┌─────────────────────┐
                │  Application Service │   <-- single source of truth
                │  Layer (lib/services)│       for business rules
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │   Prisma ORM        │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │   PostgreSQL         │
                └─────────────────────┘
```

## 2. Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js API Routes (Route Handlers), shared `lib/services/*` business logic layer
- **ORM/DB:** Prisma + PostgreSQL (Neon or Supabase in prod; SQLite for local dev — same schema, swap `provider` in `schema.prisma`)
- **Auth:** Auth.js (NextAuth) Credentials provider, JWT session, 4 fixed seeded users, role claim in session
- **Bots:** `grammy` (Telegram) in Phase 2/3, WhatsApp Cloud API webhook in Phase 4
- **NLP:** Phase 3 starts with a deterministic rule/regex parser (fast, free, no API key needed) with a fallback to an LLM call (Claude via Anthropic API) for messages the rule parser can't confidently classify. This hybrid keeps cost near-zero for 90% of messages.
- **File storage:** Receipts uploaded to S3-compatible storage (Supabase Storage / Cloudflare R2); `Attachment` table stores the URL + metadata, OCR fields left nullable for future phase.
- **Deployment:** Vercel (web + API + webhooks), Neon/Supabase (Postgres), cron via Vercel Cron for daily/weekly/monthly summary notifications.

## 3. Why this avoids refactors later

1. **Channel-agnostic service layer.** `lib/services/transactionService.ts` exposes `createExpense()`, `createIncome()`, `getCashBalance()`, etc. Web routes, the Telegram webhook, and the future WhatsApp webhook all call these same functions — never raw Prisma calls scattered around route handlers.
2. **`source` and `rawMessage` fields on Transaction from day one.** Even though Phase 1 has no bots, the schema already supports `source: WEB | TELEGRAM | WHATSAPP` and stores the original inbound text. Nothing needs migrating when bots are added.
3. **`ParsedTransactionDraft` as an intermediate type.** The NLP layer's job (Phase 3) is only to produce this draft shape (`{amount, type, category?, customerName?, businessHint?, confidence}`). The service layer turns drafts into real transactions. Phase 4's WhatsApp adapter reuses the exact same draft type, so the parser is literally copy-free reused.
4. **`PendingMessage` table for low-confidence parses.** When confidence is low, the bot stores it as pending and asks a clarifying question instead of guessing — this table exists from Phase 2 onward so Phase 3's smarter NLP just reduces how often it's used, no schema change.
5. **Multi-tenant `Business` from day one**, so adding more businesses later is a data change, not a code change.

## 4. Folder Structure

```
bizledger/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # sidebar + role-aware nav
│   │   │   ├── page.tsx                  # dashboard home
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx         # customer ledger
│   │   │   ├── suppliers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx         # supplier ledger
│   │   │   ├── reports/page.tsx
│   │   │   ├── users/page.tsx            # admin only
│   │   │   └── audit-log/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── transactions/route.ts
│   │       ├── transactions/[id]/route.ts
│   │       ├── customers/route.ts
│   │       ├── suppliers/route.ts
│   │       ├── reports/export/route.ts
│   │       ├── dashboard/summary/route.ts
│   │       ├── users/route.ts
│   │       └── webhooks/
│   │           ├── telegram/route.ts     # Phase 2/3
│   │           └── whatsapp/route.ts     # Phase 4
│   ├── components/
│   │   ├── ui/                           # shadcn primitives
│   │   ├── dashboard/                    # stat cards, charts
│   │   ├── transactions/
│   │   └── ledgers/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── rbac.ts                       # permission checks per role
│   │   ├── services/
│   │   │   ├── transactionService.ts     # shared by web + bots
│   │   │   ├── ledgerService.ts
│   │   │   ├── cashBalanceService.ts
│   │   │   ├── reportService.ts
│   │   │   └── auditService.ts
│   │   ├── nlp/
│   │   │   ├── ruleParser.ts             # Phase 3 step 1
│   │   │   ├── llmParser.ts              # Phase 3 fallback
│   │   │   └── types.ts                  # ParsedTransactionDraft
│   │   └── bots/
│   │       ├── telegram.ts               # Phase 2/3
│   │       └── whatsapp.ts               # Phase 4
│   └── types/
├── .env.example
├── package.json
└── README.md
```

## 5. Role Permission Matrix (RBAC)

| Action | Admin | Manager | Accountant | Staff |
|---|---|---|---|---|
| Create transaction | ✅ | ✅ | ✅ | ✅ |
| Edit/delete transaction | ✅ | ✅ | ✅ | ❌ |
| View all businesses | ✅ | ✅ | ✅ | ✅ (assigned only, optional) |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ❌ |

Implemented as a single `lib/rbac.ts` permission table consumed by both API routes and UI conditionals — one place to change if roles evolve.

## 6. Phase-by-phase rollout detail

**Phase 1 (this deliverable):** full CRUD web app, seeded with 4 users (Admin/Manager/Accountant/Staff), 2 businesses (Wholesale/Retail), default categories, working dashboard, ledgers with running balances, CSV export.

**Phase 2:** Add `grammy`-based Telegram bot. Webhook receives message → simple `Expense <amount> <text>` / `Received <amount> <text>` command parser (not NLP yet, just structured commands) → calls `transactionService.createExpense/createIncome` → replies with confirmation + running cash balance.

**Phase 3:** Replace the structured-command parser with `ruleParser.ts` (regex + keyword heuristics for amount/category/customer detection) and `llmParser.ts` (Claude API call with a structured-output prompt) as fallback when rule-parser confidence < threshold. Add `PendingMessage` flow for clarifying questions.

**Phase 4:** Add WhatsApp Cloud API webhook adapter (`lib/bots/whatsapp.ts`) that normalizes inbound WhatsApp messages into the same shape Telegram messages already take, then calls the **same** `ruleParser`/`llmParser`/`transactionService` chain. No parser or service code changes required.

## 7. Notifications & Audit (cross-cutting, present from Phase 1)

- Every create/update/delete on `Transaction` writes an `AuditLog` row (old value, new value, actor, timestamp) inside the same DB transaction — enforced inside `transactionService`, not at the route level, so bots get audit logging for free.
- Notification triggers (large expense, daily/weekly/monthly summary, failed parse, suspicious transaction) are modeled as a `Notification` table + a Vercel Cron job; Phase 1 ships the table and the large-expense + daily-summary triggers; failed-parse/suspicious-transaction triggers activate naturally once Phase 2/3 bots exist.
