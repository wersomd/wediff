import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Разрешаем алиас "@/..." как в проекте (нужно тестам, тянущим @/lib/db).
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
