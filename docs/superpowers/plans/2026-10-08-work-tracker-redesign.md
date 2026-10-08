# Work Tracker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обновить рабочие доски и контроль оплат, доставлять ежедневные напоминания в Telegram.

**Architecture:** Сохранить модели задач, проектов и финансов. Общая чистая функция собирает обязательства для финансового интерфейса и напоминаний. Серверный модуль доставки использует отдельный журнал PostgreSQL и защищённый планировщик.

**Tech Stack:** Next.js 15.5.19, React 19, Prisma 6, PostgreSQL, Tailwind 4, dnd-kit, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-08-work-tracker-redesign-design.md` — согласован пользователем 8 октября 2026.

## Global Constraints

- Светлая тема остаётся основной.
- `/tasks` и задачи внутри проекта открываются доской.
- Существующие значения enum сохраняются.
- Приложение сейчас рассчитано на одного пользователя.
- Пользователь подтвердил охват: долги в обе стороны и подписки.
- Секреты `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` остаются на сервере.
- Просрочка начинается на следующий календарный день после срока в часовом поясе приложения.
- Веб-проверка через gstack browse; до кода прочитать локальные руководства Next.js. Каталог `node_modules/next/dist/docs` при исследовании отсутствовал: проверить установленный пакет, при необходимости получить официальное руководство через browse.

## Review Focus

1. Скрытые фильтром или другим проектом задачи сохраняют порядок после переноса видимой карточки — задача 1.
2. Полночь Алматы и старые даты задач в 19:00 UTC не дают преждевременную просрочку — задачи 2 и 3.
3. Частичное погашение и разные валюты не превращаются в неверную сумму — задача 3.
4. Параллельный cron, разрыв соединения и частичная доставка не создают бесконечные повторы — задача 4.
5. Длинные заголовки, пустые колонки и мобильная ширина сохраняют доступность действий — задача 6.

## Task 1: Доска задач и корректное перемещение

**Files:** изменить `src/features/tasks/{constants,use-task-view,schema,actions}.ts`, `src/features/tasks/components/{tasks-view,board,board-column,task-card,task-dialog,task-filters}.tsx`; создать `src/features/tasks/board-state.ts`, `src/features/tasks/__tests__/board-state.test.ts`; обновить `view-default.test.ts`.

**Interfaces:** `resolveTaskView(raw: string | null): "board" | "list"`; `moveVisibleTask(columns: Columns, taskId: string, toStatus: TaskStatus): Columns`. Серверная смена статуса без перестановки: `setTaskStatus(input: unknown): Promise<ActionResult>`. Существующий `moveTask` используется для полного ручного порядка.

- [ ] Добавить проверку нового начального вида и явного списка; запустить `npm test -- src/features/tasks/__tests__/view-default.test.ts`, убедиться в падении старого поведения.

```ts
expect(DEFAULT_TASK_VIEW).toBe("board");
expect(resolveTaskView(null)).toBe("board");
expect(resolveTaskView("list")).toBe("list");
expect(resolveTaskView("unknown")).toBe("board");
```

- [ ] Реализовать URL-выбор и скрытие отменённых отдельным переключателем. Новая навигация без `view` открывает доску; переключение не очищает фильтры.

```ts
export function resolveTaskView(raw: string | null): "board" | "list" {
  return raw === "list" ? "list" : "board";
}
```

- [ ] Разделить смену статуса и перестановку. При фильтрах обновлять исходный полный `columns`, не заменять его отфильтрованным состоянием Board. Серверная смена статуса в транзакции добавляет карточку в конец целевой колонки и обновляет `completedAt`. При ручной перестановке сервер проверяет уникальность ID, наличие перемещаемой задачи и принадлежность остальных ID целевому статусу. Скрытые задачи других проектов сохраняют относительный порядок.

```ts
// Полный набор: visible и hidden; UI показывает только visible.
expect(moveVisibleTask(columns, "visible", "REVIEW").TODO.map(t => t.id))
  .toEqual(["hidden"]);
expect(moveVisibleTask(columns, "visible", "REVIEW").REVIEW.map(t => t.id))
  .toEqual(["review-hidden", "visible"]);
```

- [ ] Добавить тесты server action с mock Prisma: посторонний ID, повтор ID, отсутствующая задача, переход в DONE и обратно. Для сбоя сохранения проверить возврат исходного состояния и доступное сообщение об ошибке.
- [ ] Пересобрать карточку и одну панель фильтров. Быстрое создание берёт lockedProjectId, иначе выбранный реальный проект. TaskDialog использовать как правую панель на desktop с сохранением focus trap, Escape и мобильного диалога.
- [ ] Запустить `npm test -- src/features/tasks`; сохранить отдельный коммит с изменениями задач после прохождения проверок.

## Task 2: Проектная доска и состояние сроков

**Files:** изменить `src/features/projects/{queries,progress}.ts`, `components/{project-list,project-card,project-detail-header}.tsx`, `__tests__/progress.test.ts`; создать `components/project-board.tsx`.

**Interfaces:** добавить `overdueTaskCount: number` в `ProjectWithProgress`; `describeProjectDeadline(now: Date, deadline: Date | null, status: ProjectStatusLike): DeadlineInfo`. Переиспользовать существующий `setProjectStatus` с обработкой ошибок.

- [ ] Добавить тесты закрытого проекта и календарной границы, затем запустить `npm test -- src/features/projects` и подтвердить отсутствие нового поведения.

```ts
const now = new Date("2026-10-08T19:01:00Z");
expect(describeProjectDeadline(now, new Date("2026-10-08T00:00:00Z"), "IN_PROGRESS").tone)
  .toBe("overdue");
expect(describeProjectDeadline(now, new Date("2026-10-08T00:00:00Z"), "DONE").tone)
  .toBe("normal");
expect(computeProjectProgress([{ status: "DONE" }, { status: "CANCELLED" }]).percent)
  .toBe(100);
```

- [ ] Использовать `daysFromToday` для сроков. Выбирать у задач status и dueDate для подсчёта открытых просроченных; закрытые проекты исключить из предупреждений.
- [ ] Отобразить пять основных этапов и отдельный архив; добавить переключатель доска/список, по умолчанию доска. В карточке показать срок, прогресс и просроченные задачи. Этап менять доступным меню, при перетаскивании использовать те же проверки и откат.
- [ ] Обновить шапку проекта: описание, этап, срок и прогресс; завершение задач не меняет статус проекта автоматически.
- [ ] Запустить проектные тесты; проверить открытие карточки и изменение этапа; сохранить коммит.

## Task 3: Общие обязательства и финансовый обзор

**Files:** создать `src/features/payments/{types,collect,queries}.ts`, `components/upcoming-payments.tsx`, `__tests__/collect.test.ts`; изменить `src/app/(app)/finances/page.tsx`, `src/features/finances/components/finances-view.tsx`.

**Interfaces:** `PaymentObligation = { id: string; kind: "debt" | "subscription"; direction: "outgoing" | "incoming"; title: string; amount: string; currency: string; dueDate: Date; reminderDaysBefore: number; href: string }`; `getPaymentObligations(): Promise<PaymentObligation[]>`. Decimal вычисления остаются на сервере; UI получает строковую сумму.

- [ ] Написать тесты для частичного погашения, нулевого остатка, долга без срока, выключенной подписки, обоих направлений и валют. Запустить `npm test -- src/features/payments` с ожидаемым падением до реализации.

```ts
expect(remainingAmount("100.00", ["30.00", "20.00"])).toBe("50.00");
expect(remainingAmount("0.30", ["0.10", "0.20"])).toBe("0.00");
expect(remainingAmount("100.00", ["120.00"])).toBe("0.00");
```

- [ ] Определить и экспортировать `remainingAmount(principal: string, payments: string[]): string` на Prisma.Decimal: вычесть платежи, ограничить снизу нулём, вернуть `toFixed(2)`. Запросить только OPEN долги со сроком и active подписки. Отфильтровать нулевые остатки.
- [ ] Вывести «Ближайшие оплаты» до счетов: просрочено, сегодня, следующие 7 дней. Каждая запись ведёт в существующую запись через `?item=id`; проверить обработку ссылки в debts/subscriptions, добавить её при отсутствии. Суммы не агрегировать между валютами.
- [ ] Проверить, что уведомления не вызывают финансовые mutations. Запустить тесты нового модуля и существующих debts/subscriptions; сохранить коммит.

## Task 4: Серверные напоминания и доставка

**Files:** создать `src/features/reminders/{types,collect,format,telegram,delivery,queries}.ts`, тесты в `__tests__`, `src/app/api/cron/reminders/route.ts`; изменить `prisma/schema.prisma`, добавить миграцию, `.env.example`, `vercel.json`, `docs/reminders.md`.

**Interfaces:** `ReminderItem = { id: string; kind: "task" | "project" | "debt" | "subscription"; title: string; dueDate: Date; href: string; detail?: string }`; `formatDigest(items: ReminderItem[], now: Date, baseUrl: string): string[]`; `runDailyReminders(now?: Date): Promise<{ sent: number; skipped: boolean }>`.

- [ ] Добавить тесты выбора: задачи просроченные и сегодня; активные проекты и долги за 3 дня; подписки по reminderDaysBefore; исключение терминальных статусов. Все календарные сравнения через workspace-date. Подготовить кейсы UTC-полуночи и старого формата дат.

```ts
expect(daysFromToday(new Date("2026-10-08T00:00:00Z"), new Date("2026-10-08T18:59:00Z"))).toBe(0);
expect(daysFromToday(new Date("2026-10-08T00:00:00Z"), new Date("2026-10-08T19:00:00Z"))).toBe(-1);
expect(daysFromToday(new Date("2026-10-07T19:00:00Z"), new Date("2026-10-08T12:00:00Z"))).toBe(0);
```

- [ ] Создать модель ReminderDelivery: id, уникальные day/part, payload, status, attempts, leaseUntil, sentAt, errorCode, createdAt/updatedAt. Статусы pending/sending/sent/failed/unknown; хранить только очищенные коды ошибок. Добавить RLS как у остальных таблиц проекта.
- [ ] Зафиксировать содержимое частей одного дня в транзакции. Брать одну часть атомарным updateMany по допустимому статусу/попыткам, lease на 2 минуты, максимум 3 попытки. Просроченный sending переводить в unknown, автоматически не повторять: процесс мог завершиться после отправки, но до записи sent.
- [ ] Форматировать простой текст без parse_mode: названия не интерпретируются как разметка. Ограничить части 3500 UTF-16 единицами, резать по строкам и безопасно сокращать одиночные длинные значения. Ссылки строить через URL и encodeURIComponent.
- [ ] Telegram: fetch с таймаутом 15 секунд, проверить HTTP status и JSON `ok`. Сетевой таймаут и неизвестный ответ → unknown; 429 → повтор при следующем запуске не раньше retry_after; определённая ошибка без доставки → failed. Успешно отправленные части не повторять.

```ts
expect(formatDigest([], new Date(), "https://example.com")).toEqual([]);
expect(formatDigest(longItems, new Date(), "https://example.com").every(p => p.length <= 3500)).toBe(true);
// Два параллельных запуска с одним mock repository:
await Promise.all([runner.run(now), runner.run(now)]);
expect(sendMessage).toHaveBeenCalledTimes(1);
```

- [ ] В delivery tests использовать внедряемые repository и transport, экспортируемую фабрику `createDeliveryRunner({ repository, sendMessage })`. Проверить успешную часть + failed вторую, неизвестный таймаут, максимум попыток и отсутствие отправки пустой сводки.
- [ ] API принимает только правильный Bearer CRON_SECRET; без секрета закрыт. Он не полагается на middleware: тот исключает API. GET возвращает только счётчики и код результата, не секреты/названия задач.
- [ ] Настроить cron `0 4 * * *` (09:00 Алматы), env `CRON_SECRET`, `APP_BASE_URL`. В документации отдельно описать миграцию, включение расписания и ручной повтор определённых ошибок. Не обещать точное время доставки или автоматические внутридневные повторы при ежедневном cron.
- [ ] Проверить отсутствующий/неверный секрет, отсутствующий Telegram token, `ok:false`, 429, не-JSON ответ; выполнить Prisma generate и тесты; сохранить коммит.

## Task 5: Настройки напоминаний

**Files:** создать `src/features/reminders/{settings,actions}.ts`, `components/reminder-settings.tsx`, тесты settings/actions; изменить `src/app/(app)/settings/page.tsx`.

**Interfaces:** `ReminderSettings = { enabled: boolean; tasks: boolean; projects: boolean; debts: boolean; subscriptions: boolean }`; `getReminderSettings(): Promise<ReminderSettings>`; `saveReminderSettings(input: unknown): Promise<{ ok: true } | { error: string }>`. Хранение — существующая Setting, ключ `reminders`.

- [ ] Тестировать схему и auth до записи:

```ts
expect(reminderSettingsSchema.safeParse({ enabled: true, tasks: true, projects: true, debts: true, subscriptions: true }).success).toBe(true);
expect(reminderSettingsSchema.safeParse({ enabled: "yes" }).success).toBe(false);
```

- [ ] Добавить Zod object с пятью boolean, серверную проверку сессии и upsert. При отсутствии настройки использовать enabled=true и все категории=true, но доставка возможна лишь при полной серверной конфигурации. Некорректная сохранённая настройка блокирует доставку и отображает ошибку.
- [ ] UI: общий выключатель, категории, «Ежедневно около 09:00, Алматы», конфигурация Telegram, последнее sentAt, понятные сообщения failed/unknown. Никогда не отдавать token/chat ID в клиентские props.
- [ ] Подключить настройки к сборщику и runner; проверить отключённые категории и общий выключатель; сохранить коммит.

## Task 6: Визуальная доводка и итоговая проверка

**Files:** `src/app/globals.css`, затронутые компоненты задач/проектов/финансов; обновить `docs/reminders.md` результатами проверки.

- [ ] Применить согласованные токены графита; проверить contrast текста, фокуса и интерактивных элементов. Sidebar в тёмной теме сделать нейтральной поверхностью с локальным акцентом активного пункта.
- [ ] Запустить `npm test`, `npm run lint`, `npm run build`. Исправить обнаруженные регрессии и повторить затронутые проверки. Проверить миграцию на отдельной тестовой БД при доступности; не применять её к production автоматически.
- [ ] Прочитать gstack browse skill, открыть приложение. На ширинах 390, 768, 1440 проверить обе темы: доски без данных и с длинными названиями, создание, перенос, поиск, отменённые, редактирование, проекты, финансовые ссылки и настройки.
- [ ] Проверить клавиатуру: фокус, Escape, возврат фокуса после закрытия панели, меню смены статуса. Проверить, что горизонтально прокручивается доска, а не весь экран.
- [ ] Выполнить итоговый review диффа и исправить существенные замечания. Сохранить коммит проверенных изменений, не публиковать автоматически.
- [ ] В отчёте отделить готовый код от live-активации: миграция, env, расписание и подтверждённая доставка. Если окружение недоступно, явно перечислить непроверенное; не заявлять, что Telegram уже работает.
