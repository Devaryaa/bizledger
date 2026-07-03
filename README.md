# BizLedger — Phase 1

Web app for daily finance tracking across Wholesale/Retail businesses: auth, transactions, customer/supplier ledgers, cash balance, dashboard, reports, RBAC, audit log.

See `ARCHITECTURE.md` for the full system design, phase rollout plan, and folder structure.

## 1. Setup

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL (Postgres — Neon/Supabase free tier works) and NEXTAUTH_SECRET
```

For Postgres: create a free database at neon.tech or supabase.com, paste the connection string into `DATABASE_URL`.

For quick local testing without setting up Postgres: edit `prisma/schema.prisma`, change `provider = "postgresql"` to `provider = "sqlite"` and `url = "file:./dev.db"`.

Generate a secret:
```bash
openssl rand -base64 32   # paste into NEXTAUTH_SECRET
```

## 2. Database

```bash
npx prisma db push      # create tables from schema.prisma
npm run db:seed         # seed 4 users, 2 businesses, default categories
```

Seeded logins (change passwords after first login):
```
admin@bizledger.test       / Password123!  (ADMIN)
manager@bizledger.test     / Password123!  (MANAGER)
accountant@bizledger.test  / Password123!  (ACCOUNTANT)
staff@bizledger.test       / Password123!  (STAFF)
```

## 3. Run

```bash
npm run dev
# open http://localhost:3000
```

## 4. Deploy (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel, set the same env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` = your prod URL).
3. Add a Vercel Postgres/Neon database if you don't already have one.
4. Run `npx prisma db push && npm run db:seed` once against the prod database (e.g. via `vercel env pull` + local run, or a one-off script).

## 5. What's deliberately not built yet (by design)

These are Phase 2-4, scaffolded but inactive so Phase 1 ships clean:

- `src/app/api/webhooks/telegram/route.ts` — returns 501 until `TELEGRAM_BOT_TOKEN` is set
- `src/app/api/webhooks/whatsapp/route.ts` — returns 501 until `WHATSAPP_ACCESS_TOKEN` is set
- `src/lib/nlp/ruleParser.ts`, `llmParser.ts` — Phase 3 NLP, interface fixed now
- Receipt OCR fields exist on `Attachment` but aren't populated (file upload UI itself is also not built in Phase 1 — add an `Attachment` create call + S3/R2 upload when ready)

None of these require schema migrations to activate — see `ARCHITECTURE.md` section 3 for why.

## 6. Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth (Credentials) · Recharts
