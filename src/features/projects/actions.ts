"use server";

import { revalidatePath } from "next/cache";
import { ProjectStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  projectCreateSchema,
  projectUpdateSchema,
} from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function createProject(
  input: unknown,
): Promise<ActionResult> {
  await requireAuth();
  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { name, description, status, color } = parsed.data;
  await db.project.create({
    data: {
      name,
      description: clean(description),
      status,
      color: clean(color),
    },
  });
  revalidatePath("/projects");
  return { ok: true };
}

export async function updateProject(
  input: unknown,
): Promise<ActionResult> {
  await requireAuth();
  const parsed = projectUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, name, description, status, color } = parsed.data;
  await db.project.update({
    where: { id },
    data: {
      name,
      description: clean(description),
      status,
      color: clean(color),
    },
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

// Deleting a project orphans its tasks (Task.projectId is onDelete: SetNull),
// it does not delete them.
export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<ActionResult> {
  await requireAuth();
  await db.project.update({ where: { id }, data: { status } });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}
