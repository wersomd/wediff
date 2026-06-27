import type { Metadata } from "next";
import { NotesView } from "@/features/notes/components/notes-view";
import { getNotes, getNoteProjects } from "@/features/notes/queries";
import { getTags } from "@/features/tags/queries";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const [notes, projects, tags] = await Promise.all([
    getNotes(),
    getNoteProjects(),
    getTags(),
  ]);

  return (
    <NotesView
      initialNotes={notes}
      projects={projects}
      tags={tags.map((t) => t.name)}
    />
  );
}
