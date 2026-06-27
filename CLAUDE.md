# Wediff — project guide

Single-user personal "Life OS" (private Notion replacement). Built in phases 0→7.

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind v4 (CSS-token config in `src/app/globals.css`) — shadcn/ui added in Phase 1
- PostgreSQL (Supabase) + Prisma 6
- Zod, lucide-react, next-themes, date-fns
- Auth.js + TOTP 2FA (Phase 1); Supabase Storage behind `src/lib/storage.ts` (Phase 6)

> Versions are pinned to stable on purpose: Prisma 7 and Next 16 were installed first,
> but both caused fresh-release build breakage here, so we use Prisma 6 / Next 15.

## Local infra (Docker)
DB runs locally in Docker, not Supabase (dev). `docker-compose.yml`:
- Postgres 16 on host port **5434** (avoids existing local Postgres on 5432 and the
  keregewebappv3 stack on 5433). Creds wediff/wediff/wediff.
- Adminer DB UI on **http://localhost:8081**.
- `pnpm db:up` / `pnpm db:down` to start/stop.

## Commands
- `pnpm db:up` — start Postgres + Adminer (Docker)
- `pnpm dev` — dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm db:migrate` — prisma migrate dev
- `pnpm db:push` / `pnpm db:studio` / `pnpm db:seed` / `pnpm db:generate`

## Structure
- `src/app/(app)/*` — authed shell + module pages; `src/app/(auth)/*` — login (Phase 1)
- `src/components/{ui,layout,shared}` — primitives, shell, reusable bits
- `src/features/<module>/` — per-module `components/`, `actions.ts`, `queries.ts`, `schema.ts`, `types.ts`
- `src/lib/` — `db.ts`, `auth.ts`, `storage.ts`, `utils.ts`
- `src/config/` — `nav.ts`, `site.ts`
- `prisma/schema.prisma` — all 9 modules; single-user, so no `userId` on domain tables

## Conventions
- Data via Server Components (read) + Server Actions (write), validated with Zod.
- Money: `Decimal(14,2)`, never float. Default currency KZT, USD also supported (per-account).
- Dark-first; one electric-violet accent as a CSS variable.

## Windows path-casing gotcha
The real folder is `D:\Projects\wediff` (capital P). If tooling ever resolves the path
as lowercase `D:\projects`, webpack produces duplicate `_document` modules and the build
fails on `/404` prerender. Fix: run install/build from the true-cased path. A clean
`pnpm install` from the correct casing keeps `node_modules` consistent.

@AGENTS.md
