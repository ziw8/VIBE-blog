"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { SiteSectionKey } from "@/lib/site-sections";

type AdminSiteSectionEditorProps = {
  body: string;
  sectionKey: SiteSectionKey;
};

export function AdminSiteSectionEditor({
  body,
  sectionKey,
}: AdminSiteSectionEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(body);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBlogName = sectionKey === "blogName";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/site-sections/${sectionKey}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: value }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "저장하지 못했습니다.");
      }

      router.replace("/admin/home");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="grid gap-2 text-sm">
        <span className="text-black/45 dark:text-white/45">
          {isBlogName ? "블로그 이름" : "내용"}
        </span>
        {isBlogName ? (
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            maxLength={40}
            placeholder="블로그 이름"
            required
          />
        ) : (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-72 resize-y rounded-md border border-black/10 bg-transparent px-3 py-3 leading-7 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            placeholder="내용을 입력해주세요."
            required
          />
        )}
      </label>

      {status ? (
        <p className="text-sm text-black/45 dark:text-white/45">{status}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
          onClick={() => setValue(body)}
        >
          되돌리기
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 rounded-md border border-black/20 px-4 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
        >
          {isSubmitting ? "저장 중" : "저장"}
        </button>
      </div>
    </form>
  );
}
