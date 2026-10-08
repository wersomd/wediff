"use client";
import { useId } from "react";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { ProjectStatus } from "@prisma/client";
import { PROJECT_STATUS_LABELS } from "../constants";
import type { ProjectWithProgress } from "../queries";
import { ProjectCard } from "./project-card";
const stages: ProjectStatus[] = ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "DONE"];
type Props = { projects: ProjectWithProgress[]; disabled: boolean; onEdit: (p: ProjectWithProgress) => void; onDelete: (p: ProjectWithProgress) => void; onStatus: (p: ProjectWithProgress, s: ProjectStatus) => void };
function DraggableProject({ project, ...props }: Omit<Props, "projects"> & { project: ProjectWithProgress }) {
 const drag = useDraggable({ id: project.id, disabled: props.disabled });
 return <div ref={drag.setNodeRef} className={drag.isDragging ? "relative opacity-40" : "relative"}>
   <ProjectCard project={project} onEdit={() => props.onEdit(project)} onDelete={() => props.onDelete(project)} onStatusChange={s => props.onStatus(project, s)} disabled={props.disabled} />
   <button {...drag.listeners} {...drag.attributes} type="button" aria-label={`Переместить проект ${project.name}`} className="absolute left-10 top-4 touch-none rounded p-1 text-muted-foreground hover:bg-muted"><GripVertical className="size-4" /></button>
 </div>;
}
function Column({ stage, ...props }: Props & { stage: ProjectStatus }) {
 const drop = useDroppable({ id: stage });
 const projects = props.projects.filter(p => p.status === stage);
 return <section ref={drop.setNodeRef} className={`w-[300px] max-w-[85vw] shrink-0 snap-start rounded-xl p-2 ${drop.isOver ? "bg-accent" : "bg-muted/45"}`}>
  <h2 className="flex justify-between px-2 py-3 text-sm font-medium">{PROJECT_STATUS_LABELS[stage]}<span className="text-muted-foreground">{projects.length}</span></h2>
  <div className="min-h-48 space-y-3">{projects.map(p => <DraggableProject key={p.id} project={p} {...props} />)}{projects.length === 0 && <p className="px-2 py-6 text-xs text-muted-foreground">Нет проектов</p>}</div>
 </section>;
}
export function ProjectBoard(props: Props) {
 const id = useId();
 const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
 function onDragEnd(e: DragEndEvent) {
  const project = props.projects.find(p => p.id === e.active.id);
  const status = e.over?.id as ProjectStatus;
  if (!props.disabled && project && stages.includes(status) && status !== project.status) props.onStatus(project, status);
 }
 return <DndContext id={id} sensors={sensors} onDragEnd={onDragEnd}><div className="flex gap-3 overflow-x-auto pb-4 snap-x">{stages.map(stage => <Column key={stage} stage={stage} {...props} />)}</div></DndContext>;
}
