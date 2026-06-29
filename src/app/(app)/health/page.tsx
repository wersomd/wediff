import type { Metadata } from "next";
import { HealthView } from "@/features/health/components/health-view";
import { getHealthMetrics } from "@/features/health/queries";

export const metadata: Metadata = { title: "Здоровье" };

export default async function HealthPage() {
  const metrics = await getHealthMetrics();
  return <HealthView metrics={metrics} />;
}
