import "server-only";
import { subDays } from "date-fns";
import { db } from "@/lib/db";

// Health metrics with their last 30 days of logs (oldest → newest for the
// trend sparkline). Latest value is the most recent log.
export async function getHealthMetrics() {
  const since = subDays(new Date(), 30);
  const metrics = await db.healthMetric.findMany({
    orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    include: {
      logs: {
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
      },
    },
  });

  return metrics.map((m) => {
    const logs = m.logs.map((l) => ({
      id: l.id,
      date: l.date,
      value: l.value.toNumber(),
      note: l.note,
    }));
    const latest = logs.length > 0 ? logs[logs.length - 1] : null;
    return {
      id: m.id,
      name: m.name,
      unit: m.unit,
      icon: m.icon,
      target: m.target ? m.target.toNumber() : null,
      archived: m.archived,
      logs,
      latest,
    };
  });
}

export type HealthMetricRow = Awaited<
  ReturnType<typeof getHealthMetrics>
>[number];
export type HealthLogRow = HealthMetricRow["logs"][number];
