# Debts module — design spec

**Date:** 2026-06-29
**Module:** `debts` (new, 10th nav item)
**Status:** approved, ready for implementation plan

## Goal

Track personal debts both directions: **кому я должен** (`I_OWE`) and **кто должен мне**
(`OWED_TO_ME`). Show per-counterparty totals and an overall net balance. Fully integrated
with the existing **Finances** module: disbursement and repayment both create real
`Transaction` rows and move account balances (double-entry honest).

Decisions locked during brainstorming:
- **Finances link:** full integration.
- **Debt model:** discrete loans grouped by counterparty (richest variant — see both each
  loan and the per-person total).
- **Money movement:** both disbursement (выдача) and repayment (погашение) create
  transactions and move account balances.

## Data model (`prisma/schema.prisma`)

Single-user app → no `userId` on domain tables (matches existing convention).

```prisma
enum DebtDirection {
  I_OWE        // я должен (liability)
  OWED_TO_ME   // мне должны (receivable)
}

enum DebtStatus {
  OPEN
  PAID         // remaining reached 0; set automatically
}

model Counterparty {
  id        String   @id @default(cuid())
  name      String   @unique
  note      String?
  createdAt DateTime @default(now())
  debts     Debt[]
}

model Debt {
  id             String        @id @default(cuid())
  counterpartyId String
  counterparty   Counterparty  @relation(fields: [counterpartyId], references: [id], onDelete: Cascade)
  direction      DebtDirection
  principal      Decimal       @db.Decimal(14, 2)
  currency       String        @default("KZT")
  description    String?
  borrowedOn     DateTime
  dueDate        DateTime?
  status         DebtStatus    @default(OPEN)
  // Transaction created when the loan was disbursed (nullable: loan can predate the app).
  disbursementTransactionId String? @unique
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  payments       DebtPayment[]

  @@index([counterpartyId])
  @@index([status])
  @@index([dueDate])
}

model DebtPayment {
  id            String   @id @default(cuid())
  debtId        String
  debt          Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  amount        Decimal  @db.Decimal(14, 2)
  paidOn        DateTime
  note          String?
  // Transaction created for this repayment (nullable: can be recorded without an account).
  transactionId String?  @unique
  createdAt     DateTime @default(now())

  @@index([debtId])
}
```

Derived values (computed in `queries.ts`, never stored):
- **Remaining** per debt = `principal − Σ payments.amount`.
- When remaining hits `0` (or below), the action flips `status = PAID`. Reopening a debt
  (deleting a payment) flips it back to `OPEN`.
- **Per-counterparty total** = sum of remaining over their `OPEN` debts, split by
  `direction` and by `currency`.
- **Overall totals** = three figures per currency: «Я должен», «Мне должны», «Чистый
  баланс» (= owed-to-me − I-owe). KZT and USD are reported separately (never summed across
  currencies).

## Finances integration

Both disbursement and repayment create a `Transaction`. Mapping of direction + event to
transaction type and account effect:

| Event            | Direction      | Account | Tx type   |
|------------------|----------------|---------|-----------|
| Взял в долг      | `I_OWE`        | **+**   | `INCOME`  |
| Вернул долг      | `I_OWE`        | **−**   | `EXPENSE` |
| Дал в долг       | `OWED_TO_ME`   | **−**   | `EXPENSE` |
| Мне вернули долг | `OWED_TO_ME`   | **+**   | `INCOME`  |

**Categories:** debt-driven transactions use two auto-provisioned service categories so
they don't pollute normal spend analytics and can be filtered out later:
- `Долги` / `INCOME`
- `Долги` / `EXPENSE`

Resolved via the existing `category.upsert({ where: { name_type } })` pattern (see
`finances/actions.ts`).

**Account currency vs debt currency:** the chosen account's currency should match the
debt's currency. Validate in the action; surface an error if mismatched (KZT debt paid from
a USD account is rejected). Keep it simple — no FX conversion.

**Integrity (all in `prisma.$transaction`):**
- Creating a debt with an account → create disbursement `Transaction`, store its id on
  `Debt.disbursementTransactionId`.
- Recording a payment with an account → create repayment `Transaction`, store its id on
  `DebtPayment.transactionId`, recompute remaining, update `status`.
- Deleting a payment → delete its linked transaction, recompute, update `status`.
- Deleting a debt → delete all linked transactions (disbursement + each payment's) then the
  debt (payments cascade). Counterparty stays.
- Account selection at disbursement is **required** (user chose "both events move money").
  A "loan predates the app / cash, no account" escape hatch can be added later if needed —
  out of scope for v1.

## UI — `/debts`

Route: `src/app/(app)/debts/page.tsx` (Server Component, reads via `queries.ts`).
Feature dir: `src/features/debts/` with `schema.ts`, `actions.ts`, `queries.ts`,
`constants.ts`, `components/`. Mirrors `finances`/`subscriptions`.

Layout:
1. **Summary cards** (top): per currency — «Я должен», «Мне должны», «Чистый баланс».
   Net colored by sign (accent-violet positive, red negative).
2. **Grouped list**: one card per counterparty showing name + their net total; expands to
   their loans (remaining, due date, progress bar to paid, overdue badge). Settled debts
   collapsed/dimmed.
3. **Quick-add debt** dialog: counterparty (combobox — pick existing or create new),
   direction toggle (Я должен / Мне должны), amount + currency, account, borrowedOn date,
   dueDate (optional), description. Uses the same non-dismiss-on-outside-click dialog
   behavior as recent UX fix (commit 7bb816b).
4. **Debt detail / payment**: payment history list + "Добавить погашение" (amount, paidOn,
   account). Progress bar + remaining.
5. **Overdue**: `dueDate < today && status === OPEN` → badge, mirroring subscription
   reminder styling.

## Dashboard integration

Add a **Долги** summary widget to `/dashboard`: net balance per currency + count of overdue
debts as a badge (mirrors the subscription reminder badge pattern from Phase 7).

## Navigation

`src/config/nav.ts`: insert `{ title: "Долги", href: "/debts", icon: HandCoins }` between
«Финансы» and «Подписки». Import `HandCoins` from `lucide-react`.

## Validation (Zod, `schema.ts`)

- `debtCreateSchema`: counterparty name (or id), direction enum, amount positive, currency
  enum `["KZT","USD"]`, accountId required, borrowedOn date regex `^\d{4}-\d{2}-\d{2}$`,
  dueDate optional same regex, description optional max 500.
- `paymentCreateSchema`: debtId, amount positive (≤ remaining — validated in action against
  current remaining), paidOn date, accountId required, note optional.
- Mirror the `{ ok: true } | { error: string }` ActionResult convention and
  `requireAuth()` guard from `finances/actions.ts`.

## Out of scope (v1 / YAGNI)

- Interest / APR on loans.
- Multi-currency FX conversion.
- Editing `principal` after disbursement transaction exists (delete + recreate instead).
- "Cash / no account" loans (account is required in v1).
- Reminders/notifications beyond the overdue badge.

## Testing / verification

- `pnpm db:migrate` creates the new tables cleanly.
- `pnpm build` passes.
- Manual: create both-direction debts, add partial payments, confirm account balances move
  correctly per the mapping table, confirm per-currency totals and overdue badges, confirm
  deleting a debt rolls back its transactions.
