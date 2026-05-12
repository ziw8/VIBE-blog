"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/rich-text-editor";
import { cn } from "@/lib/utils";

type EditablePost = {
  contentHtml: string;
  slug: string;
  tags: string[];
  title: string;
};

type EditableDraft = {
  contentHtml: string;
  id: string;
  tags: string[];
  title: string;
};

type AdminPostEditorProps = {
  draft?: EditableDraft;
  post?: EditablePost;
  tags: string[];
};

export function AdminPostEditor({ draft, post, tags }: AdminPostEditorProps) {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const router = useRouter();
  const isEditing = Boolean(post);
  const isDraft = Boolean(draft);
  const currentItem = post ?? draft;
  const initialContentHtml = currentItem?.contentHtml ?? "";
  const [title, setTitle] = useState(currentItem?.title ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    currentItem?.tags.filter((tag) => tags.includes(tag)) ?? [],
  );
  const [bodyHtml, setBodyHtml] = useState(initialContentHtml);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  async function handleSaveDraft() {
    if (isEditing) {
      return;
    }

    setIsSavingDraft(true);
    setStatus(null);

    try {
      const response = await fetch(
        isDraft && draft
          ? `/api/admin/post-drafts/${draft.id}`
          : "/api/admin/post-drafts",
        {
          method: isDraft ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentHtml: editorRef.current?.getHtml() ?? bodyHtml,
            tags: selectedTags,
            title,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        draft?: { id: string };
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "임시 저장하지 못했습니다.");
      }

      if (!isDraft && result.draft?.id) {
        router.replace(`/admin/posts/drafts/${result.draft.id}`);
        router.refresh();
        return;
      }

      setStatus("임시 저장했습니다.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "임시 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  function handleClearDraft() {
    setTitle("");
    setSelectedTags([]);
    setBodyHtml("");
    setStatus("입력값을 비웠습니다.");
    editorRef.current?.clear();
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(
        post ? `/api/admin/posts/${post.slug}` : "/api/admin/posts",
        {
          method: post ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentHtml: editorRef.current?.getHtml() ?? bodyHtml,
            draftId: draft?.id,
            tags: selectedTags,
            title,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        post?: { slug: string };
      };

      if (!response.ok) {
        throw new Error(result.message ?? "글을 저장하지 못했습니다.");
      }

      if (post) {
        router.replace("/admin/posts");
        router.refresh();
        return;
      }

      router.replace("/admin/posts");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "글을 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!post && !draft) {
      return;
    }

    const confirmed = window.confirm(
      post ? "이 글을 삭제할까요?" : "이 임시저장 글을 삭제할까요?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatus(null);

    try {
      const response = await fetch(
        post ? `/api/admin/posts/${post.slug}` : `/api/admin/post-drafts/${draft?.id}`,
        {
          method: "DELETE",
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.message ??
            (post ? "글을 삭제하지 못했습니다." : "임시저장 글을 삭제하지 못했습니다."),
        );
      }

      router.replace("/admin/posts");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : post
            ? "글을 삭제하지 못했습니다."
            : "임시저장 글을 삭제하지 못했습니다.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handlePublish} className="space-y-8">
      <section className="space-y-3">
        <label className="grid gap-1.5 text-sm">
          <span className="text-black/45 dark:text-white/45">제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            placeholder="제목"
            required
          />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-sm text-black/45 dark:text-white/45">태그</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm transition-colors duration-300 ease-in-out",
                  selected
                    ? "border-black/35 bg-black text-white dark:border-white/50 dark:bg-white dark:text-black"
                    : "border-black/10 text-black/60 hover:border-black/25 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/35 dark:hover:text-white",
                )}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm text-black/45 dark:text-white/45">본문</p>
        <RichTextEditor
          ref={editorRef}
          ariaLabel="본문 편집기"
          enableEmbeds
          initialHtml={initialContentHtml}
          onChange={setBodyHtml}
        />
      </section>

      {status ? (
        <p className="text-sm text-black/45 dark:text-white/45">{status}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {post || draft ? (
          <button
            type="button"
            disabled={isDeleting}
            className="h-9 rounded-md px-3 text-sm text-red-600 transition-colors duration-300 ease-in-out hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
            onClick={handleDelete}
          >
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
        ) : null}
        {!post ? (
          <button
            type="button"
            disabled={isSavingDraft}
            className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:text-white/45 dark:hover:text-white"
            onClick={handleSaveDraft}
          >
            {isSavingDraft ? "저장 중" : "임시 저장"}
          </button>
        ) : null}
        <button
          type="button"
          className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
          onClick={handleClearDraft}
        >
          비우기
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 rounded-md border border-black/20 px-4 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
        >
          {isSubmitting ? "저장 중" : post ? "수정 저장" : "발행"}
        </button>
      </div>
    </form>
  );
}
