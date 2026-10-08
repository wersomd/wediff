import "server-only";
import { db } from "@/lib/db";
import { getPaymentObligations } from "@/features/payments/queries";
export async function getReminderSources() {
 const [tasks, projects, payments] = await Promise.all([
  db.task.findMany({ where: { status: { notIn: ["DONE", "CANCELLED"] }, dueDate: { not: null } }, select: { id: true, title: true, dueDate: true, status: true } }),
  db.project.findMany({ where: { status: { notIn: ["DONE", "ARCHIVED"] }, deadline: { not: null } }, select: { id: true, name: true, deadline: true, status: true } }),
  getPaymentObligations(),
 ]);
 return { tasks, projects, payments };
}
