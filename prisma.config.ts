import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Migrated from the deprecated `package.json#prisma` block (removed in Prisma 7).
// `dotenv/config` restores .env auto-loading, which a config file otherwise
// disables — Vercel injects env vars directly, so this only matters locally.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
