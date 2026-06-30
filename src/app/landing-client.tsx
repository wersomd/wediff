"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { BookOpen, CheckSquare, Flame, Heart, Target, Wallet } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  { icon: Wallet,      name: "Финансы",  desc: "Счета, транзакции, аналитика расходов", accent: "emerald" as const },
  { icon: CheckSquare, name: "Задачи",   desc: "Канбан и приоритеты",                   accent: "violet"  as const },
  { icon: Flame,       name: "Привычки", desc: "Стрики и ежедневный прогресс",          accent: "amber"   as const },
  { icon: Target,      name: "Цели",     desc: "OKR и ключевые результаты",             accent: "fuchsia" as const },
  { icon: BookOpen,    name: "Дневник",  desc: "Настроение и рефлексия",                accent: "sky"     as const },
  { icon: Heart,       name: "Здоровье", desc: "Метрики и логи",                        accent: "rose"    as const },
] as const;

type Accent = (typeof FEATURES)[number]["accent"];

const ACCENT: Record<Accent, { icon: string; bg: string; border: string }> = {
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-l-emerald-500" },
  violet:  { icon: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-l-violet-500"  },
  amber:   { icon: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-l-amber-500"   },
  fuchsia: { icon: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-l-fuchsia-500" },
  sky:     { icon: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-l-sky-500"     },
  rose:    { icon: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-l-rose-500"    },
};

const PARTICLES = [
  { top: "15%", left: "10%", size: 4, dur: "3s",   delay: "0s"   },
  { top: "25%", left: "85%", size: 3, dur: "3.7s", delay: "1.5s" },
  { top: "70%", left: "5%",  size: 5, dur: "4.4s", delay: "3s"   },
  { top: "80%", left: "90%", size: 3, dur: "3.1s", delay: "0.8s" },
  { top: "45%", left: "92%", size: 4, dur: "4.9s", delay: "2.2s" },
  { top: "60%", left: "3%",  size: 2, dur: "3.5s", delay: "4s"   },
];

function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 1280 800"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lp-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="lp-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1280" height="800" fill="#0f0f13" />

      {/* Sidebar */}
      <rect width="220" height="800" fill="#141418" />
      <text x="24" y="42" fill="#a78bfa" fontSize="20" fontWeight="700" fontFamily="system-ui,sans-serif">
        Wediff
      </text>
      {(["Дашборд", "Финансы", "Задачи", "Привычки", "Цели", "Дневник", "Здоровье"] as const).map(
        (label, i) => (
          <g key={label}>
            {i === 0 && (
              <rect x="12" y={68 + i * 44} width="196" height="36" rx="7" fill="#3b1d8a" />
            )}
            <text
              x="40"
              y={92 + i * 44}
              fill={i === 0 ? "#c4b5fd" : "#4b5563"}
              fontSize="13"
              fontFamily="system-ui,sans-serif"
            >
              {label}
            </text>
          </g>
        ),
      )}

      {/* Topbar */}
      <rect x="220" y="0" width="1060" height="56" fill="#12121a" />
      <text x="244" y="35" fill="#f4f4f5" fontSize="16" fontWeight="600" fontFamily="system-ui,sans-serif">
        Дашборд
      </text>
      <circle cx="1240" cy="28" r="16" fill="#27272a" />

      {/* Stat cards */}
      {(
        [
          { label: "Баланс KZT",      val: "₸ 450 000", color: "#34d399" },
          { label: "Задачи открытых", val: "12",         color: "#818cf8" },
          { label: "Привычки",        val: "4 / 6",      color: "#fbbf24" },
          { label: "Расходы (месяц)", val: "₸ 82 400",   color: "#f87171" },
        ] as const
      ).map((c, i) => (
        <g key={c.label}>
          <rect
            x={240 + i * 256}
            y={76}
            width="234"
            height="100"
            rx="10"
            fill="#18181f"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
          <text x={262 + i * 256} y="110" fill="#6b7280" fontSize="11" fontFamily="system-ui,sans-serif">
            {c.label}
          </text>
          <text
            x={262 + i * 256}
            y="148"
            fill={c.color}
            fontSize="22"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            {c.val}
          </text>
        </g>
      ))}

      {/* Tasks */}
      <text x="240" y="218" fill="#e5e7eb" fontSize="14" fontWeight="600" fontFamily="system-ui,sans-serif">
        Задачи на сегодня
      </text>
      {(
        [
          "Оплатить счёт за интернет",
          "Позвонить врачу",
          "Проверить месячный бюджет",
          "Пробежка 5 км",
        ] as const
      ).map((t, i) => (
        <g key={t}>
          <rect
            x="240"
            y={228 + i * 46}
            width="490"
            height="38"
            rx="8"
            fill="#18181f"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <circle cx="264" cy={247 + i * 46} r="8" fill="none" stroke="#374151" strokeWidth="1.5" />
          <text x="283" y={252 + i * 46} fill="#d1d5db" fontSize="12" fontFamily="system-ui,sans-serif">
            {t}
          </text>
        </g>
      ))}

      {/* Finance chart */}
      <rect x="752" y="200" width="496" height="240" rx="10" fill="#18181f" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <text x="774" y="228" fill="#e5e7eb" fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif">
        Финансы этого месяца
      </text>
      {([55, 80, 40, 110, 75, 95, 60] as const).map((h, i) => (
        <rect
          key={i}
          x={774 + i * 62}
          y={400 - h}
          width="30"
          height={h}
          rx="4"
          fill={i % 2 === 0 ? "url(#lp-bar1)" : "url(#lp-bar2)"}
        />
      ))}

      {/* Habits */}
      <rect x="240" y="432" width="490" height="188" rx="10" fill="#18181f" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <text x="260" y="460" fill="#e5e7eb" fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif">
        Привычки
      </text>
      {(
        [
          { name: "Спорт",     width: 280, color: "#34d399" },
          { name: "Чтение",    width: 190, color: "#fbbf24" },
          { name: "Медитация", width: 330, color: "#818cf8" },
          { name: "Вода",      width: 210, color: "#22d3ee" },
        ] as const
      ).map((h, i) => (
        <g key={h.name}>
          <text x="260" y={490 + i * 32} fill="#9ca3af" fontSize="12" fontFamily="system-ui,sans-serif">
            {h.name}
          </text>
          <rect x="340" y={475 + i * 32} width="360" height="10" rx="5" fill="#27272a" />
          <rect x="340" y={475 + i * 32} width={h.width} height="10" rx="5" fill={h.color} fillOpacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

export function LandingClient() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.646 0.246 292.717 / 0.18) 0%, transparent 70%)",
            animation: "pulse-bg 6s ease-in-out infinite",
          }}
        />

        {PARTICLES.map((p, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full bg-primary/30"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `float ${p.dur} ease-in-out ${p.delay} infinite alternate`,
            }}
          />
        ))}

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl font-bold tracking-tight sm:text-7xl"
        >
          Твоя жизнь.
          <br />
          <span className="text-primary">В одном месте.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Финансы, задачи, привычки, цели — всё под контролем.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/40"
            >
              Попробовать →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12 text-center text-3xl font-bold"
          >
            Все модули в одном приложении
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, name, desc, accent }) => {
              const cls = ACCENT[accent];
              return (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  className={`rounded-xl border border-l-4 border-border ${cls.border} bg-card p-5`}
                >
                  <div className={`mb-3 inline-flex rounded-lg p-2 ${cls.bg}`}>
                    <Icon className={`size-5 ${cls.icon}`} />
                  </div>
                  <h3 className="mb-1 font-semibold">{name}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── App Preview ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12 text-center text-3xl font-bold"
          >
            Всё в одном интерфейсе
          </motion.h2>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-primary/10"
          >
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
              <span aria-hidden="true" className="size-3 rounded-full bg-rose-500" />
              <span aria-hidden="true" className="size-3 rounded-full bg-amber-500" />
              <span aria-hidden="true" className="size-3 rounded-full bg-emerald-500" />
              <div className="ml-4 flex-1 rounded-md bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                wediff.app/dashboard
              </div>
            </div>
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-2xl border border-primary/30 bg-card p-12 text-center shadow-xl shadow-primary/5"
          >
            <h2 className="mb-4 text-3xl font-bold">Готов начать?</h2>
            <p className="mb-8 text-muted-foreground">Всё твоё — в одном месте.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/40"
              >
                Войти →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Wediff · 2026
      </footer>
    </main>
  );
}
