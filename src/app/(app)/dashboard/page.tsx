import type { Metadata } from "next";
import { getTodayWorkspace } from "@/features/dashboard/workspace-queries";
import { TodayView } from "@/features/dashboard/components/today-view";

export const metadata: Metadata = { title: "Сегодня" };
export default async function DashboardPage() {
  return <TodayView data={await getTodayWorkspace()} />;
}
