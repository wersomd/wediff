# Landing Page Design

**Date:** 2026-06-30  
**Status:** Approved

## Goal

Replace the current root `/` redirect with a beautiful dark landing page for Wediff — a personal life OS. Russian language, dark electric-violet aesthetic matching the app, Framer Motion animations, app screenshot, and a CTA button linking to `/dashboard`.

## Out of Scope

- i18n / language switcher
- Marketing analytics (no GTM, no pixels)
- Waitlist or email capture
- Separate deployment or Astro site

---

## Architecture

The landing page lives at `src/app/page.tsx` (root route). It is a **Server Component** that checks auth: if the user is already logged in, it redirects to `/dashboard`. If not, it renders the landing.

Animated sections are extracted into a `src/app/(landing)/` client component file (`landing-client.tsx`) — the server component shell imports it. This keeps the auth check server-side while allowing Framer Motion (client-only) for animations.

App screenshot is a static PNG captured from the running dev server and saved to `public/screenshot-dashboard.png`. It is embedded in the Preview section inside a browser chrome frame built with Tailwind.

---

## Sections

### 1. Hero

- Full-viewport height (`min-h-screen`)
- Animated radial gradient backdrop: electric-violet (`oklch(0.646 0.246 292.717)`) fading to dark background — slow pulse animation via CSS `@keyframes` on an absolutely-positioned `div`
- Floating particle dots (pure CSS, 6-8 small circles, subtle opacity animation, no JS)
- Headline: **"Твоя жизнь. В одном месте."** — large, bold, Geist Sans
- Subheadline: **"Финансы, задачи, привычки, цели — всё под контролем."** — muted foreground
- Primary CTA button: **"Попробовать →"** → `/dashboard` — violet, hover scale
- Framer Motion: `fadeInUp` on headline, subheadline, button (staggered, 0.15s delay each)

### 2. Features Grid

- 6 cards in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid
- Each card: coloured icon chip + module name + one-line description
- Cards use the existing `bg-card border-border` tokens
- Left border accent per module colour (matches dashboard StatCard pattern)
- Framer Motion: staggered `fadeInUp` on scroll via `whileInView` + `viewport={{ once: true }}`

| Module | Icon | Accent | Description |
|--------|------|--------|-------------|
| Финансы | Wallet | emerald | Счета, транзакции, аналитика расходов |
| Задачи | CheckSquare | violet | Канбан и приоритеты |
| Привычки | Flame | amber | Стрики и ежедневный прогресс |
| Цели | Target | fuchsia | OKR и ключевые результаты |
| Дневник | BookOpen | sky | Настроение и рефлексия |
| Здоровье | Heart | rose | Метрики и логи |

### 3. App Preview

- Section title: **"Всё в одном интерфейсе"**
- Browser chrome frame: dark rounded rectangle with three dot circles (red/yellow/green) at top
- Inside the frame: `<Image>` of `public/screenshot-dashboard.png` (Next.js `<Image>` with `priority`)
- Subtle shadow: `shadow-2xl shadow-violet-500/20`
- Framer Motion: fade-in + slight `y` translate on scroll into view

### 4. CTA Bottom

- Dark card with violet gradient border (`border-violet-500/30`)
- Headline: **"Готов начать?"**
- Button: **"Войти →"** → `/dashboard`
- Framer Motion: `fadeInUp` on scroll

### 5. Footer

- Single row: `Wediff · 2026`
- Muted foreground, centered

---

## Files

| File | Action | Notes |
|------|--------|-------|
| `src/app/page.tsx` | Rewrite | Server component: auth check → redirect or render `<LandingClient />` |
| `src/app/landing-client.tsx` | Create | `"use client"` — all sections with Framer Motion |
| `public/screenshot-dashboard.png` | Create | Screenshot captured via `/browse` skill or `pnpm dev` + browser |
| `package.json` | Modify | Add `framer-motion` |

---

## Animation Details

All Framer Motion variants share one reusable object:

```ts
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}
```

- Hero elements: `initial="hidden" animate="visible"` with `transition.delay` staggered
- Scroll sections: `initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}`
- Feature cards: parent `staggerChildren: 0.08` container variant
- CTA button: `whileHover={{ scale: 1.03 }}` + `whileTap={{ scale: 0.97 }}`

---

## Screenshot Strategy

1. Run `pnpm dev` locally (DB not required for landing page itself)
2. Seed the DB or use `/browse` to capture a screenshot of `/dashboard` with real data
3. Save as `public/screenshot-dashboard.png` at `1280×800` or similar widescreen ratio
4. If DB unavailable at build time, use a high-quality static placeholder image generated as an SVG that mimics the dashboard UI
