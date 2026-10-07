# Bold light workspace implementation plan

> Execute inline using superpowers:executing-plans. User approved the spec and explicitly requested coding and GitHub push on 2026-10-07.

**Goal:** Ship the approved light, bold personal workspace with actionable tasks, payments and calendar.
**Architecture:** Reuse Server Actions and Prisma models; share date/status selection helpers; client components own forms and filters. Isolate all visual changes to workspace chrome and shared UI.
**Tech Stack:** Next.js 15.5, React 19, Tailwind 4, Prisma 6, Radix, Vitest.
**Spec:** ../specs/2026-10-07-bold-workspace-design.md

## Global constraints
- Russian UI, Asia/Almaty calendar boundaries; date-only records retain their calendar date.
- Preserve database data, auth, financial mutation semantics and existing routes.
- No unrelated RLS migration in commits. Push a codex branch to origin after verification.
- Preserve saved theme preference; light is the new default.

## Review focus
- REVIEW/ON_HOLD tasks must appear in open task summaries.
- Midnight in Almaty must not use server timezone.
- Filtered board cannot silently reorder incomplete columns.
- Deep links must open records and be dismissible without reopening after refresh.
- Pending/failed writes must not lose entered data or leave optimistic state committed.

## Tasks
- [ ] 1. Domain helpers and regression tests: `src/lib/workspace-date.ts`, `src/features/tasks/view.ts`, `constants.ts`, `use-task-view.ts`, dashboard selectors. Verify UTC midnight, local midnight, seven-day boundary, closed statuses and combined title search. Run targeted tests before and after implementation.
- [ ] 2. Workspace shell: `components/layout/workspace-shell.tsx`, `(app)/layout.tsx`, `globals.css`, root theme and shared headers. Sidebar on desktop, Radix mobile drawer, title/search/create menu. Preserve all destinations, account and theme controls. Check keyboard focus and 390/768/1440 widths.
- [ ] 3. Today dashboard: replace `(app)/dashboard/page.tsx`, add `features/dashboard/components/today-view.tsx` and server query. Fetch real tasks/payments/events/balances. Tabs select date ranges, list opens task editor, completion updates on server. Empty states contain creation links.
- [ ] 4. Task workspace: update list rows, toolbar, board columns and task dialog. Add searchable URL state, quick date/status filters, responsive side panel. Restore optimistic state on rejected and thrown actions. Retain drag restrictions and explicit explanation.
- [ ] 5. Cross-module integration: query-based record opening in tasks/subscriptions/debts/calendar; create actions for tasks/calendar/finances. Update calendar status/time handling and revalidation paths. Restyle finance, debt, subscription and project surfaces consistently. Subscription action states clearly that only next date advances.
- [ ] 6. Verification and delivery: full Vitest, ESLint, TypeScript/build; gstack browse visual/interaction QA; fresh reviewer for whole diff, fix material issues. Commit only scoped files and push `codex/bold-light-workspace`; create and attach PR if CLI permits.

## Execution ledger
- Baseline: 84/84 tests passing. Branch `codex/bold-light-workspace` created from main. Existing RLS migration left unmodified.
- Installed Next package has no `dist/docs` directory; use its published v15 docs and installed declarations as fallback.
- Ruling: implement in current checkout on a dedicated branch; workspace has installed dependencies and an unrelated untracked migration, neither needs copying or mutation.
