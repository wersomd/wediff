# Приём заявок с сайта → инбокс в wediff

**Дата:** 2026-07-09
**Статус:** дизайн утверждён, готов к плану реализации
**Репозитории:** `wediff` (бэкенд + инбокс), `wersomd.github.io` (форма на сайте)

## Задача

Форма заявки на лендинге `wersomd.github.io` (статичный сайт на GitHub Pages, без
своего бэкенда) сейчас никуда не сохраняет лиды — она лишь открывает WhatsApp с
подставленным текстом, и клиенту нужно самому нажать «отправить». Лиды теряются.

Нужно, чтобы заявки с сайта падали в личное приложение пользователя **wediff**
(Next.js 15 + Prisma + Supabase, задеплоено на `https://wediff.vercel.app`) — то
есть у пользователя появляется собственная мини-CRM/инбокс заявок прямо в его
life-OS, плюс мгновенное уведомление в Telegram.

## Ограничения и контекст

- **Сайт статичный** → форма может только `POST`-ить на внешний публичный URL.
  Значит приёмник — публичный роут в wediff (`https://wediff.vercel.app/api/leads`).
- **wediff — single-user.** По конвенции схемы доменные таблицы НЕ несут `userId`
  (см. комментарий в `prisma/schema.prisma`). Модель `Lead` тоже без `userId`.
- **middleware не трогает `/api`** (`src/middleware.ts` matcher исключает `api`),
  поэтому публичный роут `/api/leads` не будет заблокирован авторизацией, а
  остальная часть приложения остаётся приватной.
- **Cross-origin:** сайт на `https://wersomd.github.io` шлёт запрос на другой
  домен (`wediff.vercel.app`) → нужен CORS (обработка preflight `OPTIONS` и
  заголовки `Access-Control-Allow-*`).
- Конвенции wediff: feature-модули `src/features/<name>/` (`schema.ts`,
  `queries.ts`, `actions.ts`, `components/`), страницы в `src/app/(app)/<name>/`,
  Prisma-клиент из `src/lib/db.ts`, авторизация через `auth()` из `src/lib/auth.ts`,
  навигация в `src/config/nav.ts`.

## Архитектура

### Репозиторий `wediff`

#### 1. Модель данных — `prisma/schema.prisma`

```prisma
enum LeadStatus {
  NEW
  CONTACTED
  ARCHIVED
}

model Lead {
  id        String     @id @default(cuid())
  name      String
  contact   String     // телефон / мессенджер / email — как ввёл клиент
  message   String     @default("")
  source    String     @default("wersomd.github.io") // с какого сайта
  status    LeadStatus @default(NEW)
  createdAt DateTime   @default(now())

  @@index([status])
  @@index([createdAt])
}
```

Миграция создаётся вручную в `prisma/migrations/<timestamp>_add_leads/` (стиль
существующих миграций проекта) и применяется на Supabase через
`pnpm prisma migrate deploy` (или `db push` для дев-БД). Prisma-клиент
регенерируется.

#### 2. Публичный роут приёма — `src/app/api/leads/route.ts`

- `export async function OPTIONS()` — отвечает на CORS-preflight заголовками из
  общего хелпера `corsHeaders(origin)`.
- `export async function POST(req)`:
  1. Проверка `Origin`: если задан `LEADS_ALLOWED_ORIGIN` и origin не совпадает →
     403. По умолчанию разрешён `https://wersomd.github.io`.
  2. (Опц.) проверка заголовка `x-lead-token` против `LEADS_INBOUND_TOKEN`, если
     переменная задана. Токен виден в клиентском JS — это лишь базовый барьер,
     не секрет.
  3. Парсинг JSON тела zod-схемой `leadInboundSchema`.
  4. **Honeypot:** если скрытое поле `website` непустое → это бот. Возвращаем
     `{ ok: true }` (200) БЕЗ записи в БД (тихо игнорируем).
  5. `db.lead.create({ data: { name, contact, message, source } })`.
  6. **Fire-and-forget** Telegram-уведомление (не блокирует и не роняет ответ —
     ошибки логируются, но не пробрасываются).
  7. Ответ `{ ok: true }` (200) с CORS-заголовками.
- Ошибки валидации → 400 `{ error }` (тоже с CORS-заголовками).
- Заголовки CORS на ВСЕХ ответах роута.

#### 3. Telegram-уведомление — `src/features/leads/notify.ts`

- `notifyNewLead(lead)` — POST на
  `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage`
  с `chat_id = TELEGRAM_CHAT_ID` и текстом заявки (имя, контакт, задача, источник).
- Если переменные не заданы — тихо ничего не делает (фича опциональна).
- Любые сетевые ошибки ловятся и логируются, наружу не пробрасываются.

#### 4. Feature-модуль — `src/features/leads/`

- `schema.ts` — zod-схемы:
  - `leadInboundSchema` (`name` 1–120, `contact` 1–160, `message` ≤ 2000 опц.,
    `source` опц., `website` honeypot опц.).
  - `leadStatusSchema` (enum `NEW`/`CONTACTED`/`ARCHIVED`).
- `queries.ts` — `getLeads()`: `requireAuth()` затем
  `db.lead.findMany({ orderBy: { createdAt: "desc" } })`.
- `actions.ts` — server actions с `requireAuth()` (паттерн как в
  `features/notes/actions.ts`):
  - `setLeadStatus(id, status)` → обновляет статус, `revalidatePath("/leads")`.
  - `deleteLead(id)` → удаляет, `revalidatePath("/leads")`.
- `components/leads-view.tsx` — клиентский инбокс:
  - список карточек заявок: имя, контакт, задача, время, бейдж статуса;
  - фильтр по статусу (Все / Новые / В работе / Архив);
  - действия: «Связался» (→ CONTACTED), «В архив» (→ ARCHIVED), «Удалить»;
  - быстрые ссылки по контакту: WhatsApp (`wa.me`), Telegram, `tel:` — по
    возможности распарсить контакт; иначе кнопка «Скопировать».

#### 5. Страница — `src/app/(app)/leads/page.tsx`

Серверный компонент (паттерн как `notes/page.tsx`): `metadata.title = "Заявки"`,
`getLeads()`, рендер `<LeadsView initialLeads={leads} />`.

#### 6. Навигация — `src/config/nav.ts`

Добавить в `mainNav`: `{ title: "Заявки", href: "/leads", icon: Inbox }`
(иконка `Inbox` из `lucide-react`). Разместить логично — например, рядом с
«Проектами» или в начале, на усмотрение.

#### 7. Переменные окружения — `.env.example` (+ Vercel)

```
# Приём заявок с внешних сайтов
LEADS_ALLOWED_ORIGIN=https://wersomd.github.io
LEADS_INBOUND_TOKEN=            # опционально, базовый барьер
# Telegram-уведомление о новой заявке
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

На Vercel те же переменные выставляются в настройках проекта (Production).

### Репозиторий `wersomd.github.io`

#### 1. `index.html` — форма

- Добавить скрытое honeypot-поле внутри `#lead-form`:
  ```html
  <input type="text" name="website" tabindex="-1" autocomplete="off"
         aria-hidden="true" class="hp-field">
  ```
  (CSS-класс прячет поле вне экрана; для людей невидимо, боты заполняют.)
- Убрать заглушку `action="https://formspree.io/f/YOUR_FORM_ID"` — она больше не
  нужна (endpoint зашит в JS-конфиг).

#### 2. `js/main.js` — `initForm()`

- Конфиг вверху: `const LEADS_ENDPOINT = "https://wediff.vercel.app/api/leads";`
  (+ опц. токен).
- При сабмите: валидация имени/контакта (как сейчас) → `fetch(LEADS_ENDPOINT,
  { method: "POST", headers: { "Content-Type": "application/json",
  ...(token && { "x-lead-token": token }) }, body: JSON.stringify({ name,
  contact, message, website, source: "wersomd.github.io" }) })`.
- Успех (`res.ok`) → «Заявка отправлена. Скоро свяжемся!», `form.reset()`.
- Ошибка/сеть/офлайн → **fallback в WhatsApp** (сохранить текущее поведение,
  чтобы лид не терялся) + сообщение об этом.

## Поток данных

```
Клиент заполняет форму на wersomd.github.io
        │  fetch POST JSON (+honeypot, +source)
        ▼
POST https://wediff.vercel.app/api/leads   (публичный, CORS)
        │  zod-валидация, honeypot-фильтр
        ├─► db.lead.create()  → Supabase (Postgres)
        └─► notifyNewLead()   → Telegram sendMessage (fire-and-forget)
        │
        ▼
Пользователь видит заявку на /leads (инбокс, auth) и получает пинг в Telegram
```

## Обработка ошибок

- Валидация не прошла → 400 `{ error }`, форма показывает ошибку и предлагает
  WhatsApp.
- Honeypot заполнен → 200 `{ ok: true }`, но лид НЕ пишется (боту не намекаем).
- БД недоступна → 500; форма падает в WhatsApp-fallback, лид не теряется.
- Telegram недоступен → лид всё равно сохранён в БД; ошибка залогирована.
- Неверный origin/токен → 403 (форма падает в WhatsApp-fallback).

## Защита от спама

- Honeypot-поле `website` (основной барьер).
- Опциональный `x-lead-token` (слабый барьер, токен публичен).
- Проверка `Origin`.
- На будущее (вне MVP): Cloudflare Turnstile / hCaptcha, rate-limit по IP.

## Тестирование

- Роут `/api/leads`: валидный POST создаёт лид; honeypot-POST не создаёт;
  невалидное тело → 400; OPTIONS отдаёт CORS-заголовки.
- Server actions: смена статуса и удаление под авторизацией; без сессии →
  Unauthorized.
- Ручная проверка: сабмит формы на превью сайта → лид появляется на `/leads` +
  приходит Telegram-пинг; при недоступном endpoint — открывается WhatsApp.

## Что нужно от пользователя (ручные шаги)

1. Создать Telegram-бота через `@BotFather`, получить `TELEGRAM_BOT_TOKEN`.
2. Узнать свой `TELEGRAM_CHAT_ID` (написать боту → `getUpdates`).
3. Выставить env-переменные на Vercel (Production) и локально в `.env`.
4. Применить Prisma-миграцию к Supabase и редеплой wediff.

## Вне объёма (YAGNI)

- Многопользовательские лиды / привязка к клиентам.
- Веб-CAPTCHA (пока honeypot достаточно).
- Двусторонняя синхронизация с amoCRM/Bitrix24.
- Аналитика/отчёты по заявкам.
