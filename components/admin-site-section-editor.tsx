"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/rich-text-editor";
import { sectionBodyToHtml, type SiteSectionKey } from "@/lib/site-sections";

type AdminSiteSectionEditorProps = {
  body: string;
  sectionKey: SiteSectionKey;
};

export function AdminSiteSectionEditor({
  body,
  sectionKey,
}: AdminSiteSectionEditorProps) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const initialBodyHtml = sectionBodyToHtml(body);
  const [value, setValue] = useState(body);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
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
        body: JSON.stringify({
          body: isBlogName ? value : (editorRef.current?.getHtml() ?? bodyHtml),
        }),
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
      <div className="grid gap-2 text-sm">
        {isBlogName ? (
          <label
            htmlFor="site-section-blog-name"
            className="text-black/45 dark:text-white/45"
          >
            블로그 이름
          </label>
        ) : (
          <p className="text-black/45 dark:text-white/45">내용</p>
        )}
        {isBlogName ? (
          <input
            id="site-section-blog-name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            maxLength={40}
            placeholder="블로그 이름"
            required
          />
        ) : (
          <RichTextEditor
            ref={editorRef}
            ariaLabel={`${sectionKey} 편집기`}
            initialHtml={initialBodyHtml}
            onChange={setBodyHtml}
          />
        )}
      </div>

      {status ? (
        <p className="text-sm text-black/45 dark:text-white/45">{status}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
          onClick={() => {
            setValue(body);
            setBodyHtml(initialBodyHtml);
            editorRef.current?.setHtml(initialBodyHtml);
          }}
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
