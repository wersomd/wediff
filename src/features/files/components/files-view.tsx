"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  File as FileIcon,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  Home,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  getFileUrl,
  renameFolder,
  uploadFile,
} from "../actions";
import type { Breadcrumb, FileEntry, FolderEntry } from "../queries";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1)} МБ`;
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("text/") || mime.includes("pdf")) return FileText;
  return FileIcon;
}

export function FilesView({
  folders,
  files,
  breadcrumbs,
  currentId,
}: {
  folders: FolderEntry[];
  files: FileEntry[];
  breadcrumbs: Breadcrumb[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const [folderDialog, setFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renaming, setRenaming] = useState<FolderEntry | null>(null);

  function submitFolder() {
    start(async () => {
      const res = renaming
        ? await renameFolder(renaming.id, folderName)
        : await createFolder(folderName, currentId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(renaming ? "Папка переименована" : "Папка создана");
      setFolderDialog(false);
      setFolderName("");
      setRenaming(null);
      router.refresh();
    });
  }

  function onPickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const items = Array.from(list);
    start(async () => {
      let failed = 0;
      for (const f of items) {
        const fd = new FormData();
        fd.append("file", f);
        if (currentId) fd.append("folderId", currentId);
        const res = await uploadFile(fd);
        if ("error" in res) {
          failed++;
          toast.error(`${f.name}: ${res.error}`);
        }
      }
      const ok = items.length - failed;
      if (ok > 0) toast.success(`Загружено файлов: ${ok}`);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  function openFile(id: string) {
    start(async () => {
      const res = await getFileUrl(id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  function removeFile(f: FileEntry) {
    if (!window.confirm(`Удалить файл «${f.name}»?`)) return;
    start(async () => {
      const res = await deleteFile(f.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Файл удалён");
      router.refresh();
    });
  }

  function removeFolder(folder: FolderEntry) {
    if (
      !window.confirm(`Удалить папку «${folder.name}» со всем содержимым?`)
    )
      return;
    start(async () => {
      const res = await deleteFolder(folder.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Папка удалена");
      router.refresh();
    });
  }

  const empty = folders.length === 0 && files.length === 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/files"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Home className="size-4" />
            Файлы
          </Link>
          {breadcrumbs.map((b) => (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight className="size-4 text-muted-foreground" />
              <Link
                href={`/files?folder=${b.id}`}
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {b.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setRenaming(null);
              setFolderName("");
              setFolderDialog(true);
            }}
          >
            <FolderPlus className="size-4" />
            Папка
          </Button>
          <Button onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" />
            Загрузить
          </Button>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => onPickFiles(e.target.files)}
          />
        </div>
      </div>

      {empty ? (
        <EmptyState
          icon={FolderIcon}
          title="Папка пуста"
          description="Создайте папку или загрузите файлы."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <Link
                href={`/files?folder=${folder.id}`}
                className="absolute inset-0 rounded-xl"
                aria-label={folder.name}
              />
              <div className="flex items-start justify-between">
                <FolderIcon className="size-8 text-primary" />
                <div className="relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 text-muted-foreground opacity-0 outline-none hover:bg-accent group-hover:opacity-100"
                      aria-label="Действия"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setRenaming(folder);
                          setFolderName(folder.name);
                          setFolderDialog(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        Переименовать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => removeFolder(folder)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="mt-3 truncate font-medium">{folder.name}</p>
              <p className="text-xs text-muted-foreground">
                {folder._count.children} папок · {folder._count.files} файлов
              </p>
            </div>
          ))}

          {files.map((file) => {
            const Icon = fileIcon(file.mimeType);
            return (
              <div
                key={file.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <button
                  type="button"
                  onClick={() => openFile(file.id)}
                  className="absolute inset-0 rounded-xl"
                  aria-label={file.name}
                />
                <div className="flex items-start justify-between">
                  <Icon className="size-8 text-muted-foreground" />
                  <div className="relative z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="rounded-md p-1 text-muted-foreground opacity-0 outline-none hover:bg-accent group-hover:opacity-100"
                        aria-label="Действия"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => openFile(file.id)}
                          className="cursor-pointer"
                        >
                          Открыть
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => removeFile(file)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-3 truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {renaming ? "Переименовать папку" : "Новая папка"}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Название папки"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitFolder();
              }
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderDialog(false)}>
              Отмена
            </Button>
            <Button onClick={submitFolder} disabled={folderName.trim().length === 0}>
              {renaming ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
