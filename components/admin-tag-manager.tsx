"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type EditableTag = {
  id: string;
  name: string;
};

type AdminTagManagerProps = {
  tags: EditableTag[];
};

async function readResponse(response: Response) {
  return (await response.json().catch(() => ({}))) as { message?: string };
}

export function AdminTagManager({ tags }: AdminTagManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("new");
    setStatus(null);

    try {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "태그를 추가하지 못했습니다.");
      }

      setNewName("");
      setStatus("추가했습니다.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "태그를 추가하지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(id: string) {
    setBusyId(id);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingName }),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "태그를 수정하지 못했습니다.");
      }

      setEditingId(null);
      setEditingName("");
      setStatus("수정했습니다.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "태그를 수정하지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 태그를 삭제할까요?")) {
      return;
    }

    setBusyId(id);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE",
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "태그를 삭제하지 못했습니다.");
      }

      setStatus("삭제했습니다.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "태그를 삭제하지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-2 border-t border-black/10 pt-4 dark:border-white/15 sm:flex-row"
      >
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
          placeholder="새 태그"
          required
        />
        <button
          type="submit"
          disabled={busyId === "new"}
          className="h-10 rounded-md border border-black/20 px-4 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
        >
          {busyId === "new" ? "추가 중" : "추가"}
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="font-semibold text-black dark:text-white">등록된 태그</h2>
        <ul className="flex flex-col">
          {tags.map((tag) => {
            const editing = editingId === tag.id;

            return (
              <li
                key={tag.id}
                className="flex min-h-11 flex-col justify-between gap-2 border-t border-black/10 py-2 dark:border-white/15 sm:flex-row sm:items-center"
              >
                {editing ? (
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35"
                    autoFocus
                  />
                ) : (
                  <span className="min-w-0 flex-1 text-black/75 dark:text-white/90">
                    {tag.name}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === tag.id}
                        className="text-sm text-black underline decoration-black/20 underline-offset-4 transition-colors duration-300 ease-in-out hover:decoration-black/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:decoration-white/35 dark:hover:decoration-white/65"
                        onClick={() => handleUpdate(tag.id)}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="text-sm text-black underline decoration-black/20 underline-offset-4 transition-colors duration-300 ease-in-out hover:decoration-black/50 dark:text-white dark:decoration-white/35 dark:hover:decoration-white/65"
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                        }}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        disabled={busyId === tag.id}
                        className="text-sm text-red-600 transition-colors duration-300 ease-in-out hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(tag.id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {status ? (
        <p className="text-sm text-black/45 dark:text-white/45">{status}</p>
      ) : null}
    </div>
  );
}
