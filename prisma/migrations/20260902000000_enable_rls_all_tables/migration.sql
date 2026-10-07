-- Enable Row Level Security on every table in the public schema.
--
-- wh-os talks to Postgres only through Prisma (role `postgres`, which has
-- BYPASSRLS) and never through the Supabase Data API / PostgREST. Enabling RLS
-- with NO policies means: deny all access via the `anon` / `authenticated`
-- roles, while Prisma keeps working untouched.
--
-- This silences the Supabase Security Advisor "RLS has not been enabled" lints.

ALTER TABLE "public"."User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Setting"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Tag"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Project"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Task"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Transaction"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Counterparty"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Debt"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DebtPayment"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Subscription"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CalendarEvent"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Note"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Bookmark"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Folder"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FileObject"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Goal"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."GoalKeyResult"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."JournalEntry"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HealthMetric"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HealthLog"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WishItem"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Budget"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Lead"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RateLimit"      ENABLE ROW LEVEL SECURITY;
