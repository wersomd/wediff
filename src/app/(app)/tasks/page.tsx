import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { getTasks, getProjectsForPicker } from "@/features/tasks/queries";

export const metadata: Metadata = { title: "Задачи" };

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getProjectsForPicker(),
  ]);

  return (
    <>
      <PageHeader
        title="Задачи"
        description="Статусы, приоритеты, сроки и привязка к проектам."
      />
      <TasksView initialTasks={tasks} projects={projects} />
    </>
  );
}
