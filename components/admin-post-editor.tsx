"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

type EditablePost = {
  contentHtml: string;
  slug: string;
  tags: string[];
  title: string;
};

type AdminPostEditorProps = {
  post?: EditablePost;
  tags: string[];
};

type DraftPost = {
  bodyHtml: string;
  tags: string[];
  title: string;
};

const DRAFT_KEY = "blog-admin-post-draft";
const colorOptions = [
  { label: "검정", swatch: "var(--article-default-text)", value: "default" },
  { label: "회색", swatch: "var(--article-muted-text)", value: "muted" },
] as const;
const alignmentOptions = [
  ["justifyLeft", "왼쪽 정렬", "L"],
  ["justifyCenter", "가운데 정렬", "C"],
  ["justifyRight", "오른쪽 정렬", "R"],
  ["justifyFull", "양쪽 정렬", "J"],
] as const;

function getSelectionRange() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  return selection.getRangeAt(0);
}

function normalizeLinkUrl(value: string | null) {
  const trimmedUrl = value?.trim();

  if (!trimmedUrl || /^javascript:/i.test(trimmedUrl)) {
    return null;
  }

  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

export function AdminPostEditor({ post, tags }: AdminPostEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const router = useRouter();
  const isEditing = Boolean(post);
  const [title, setTitle] = useState(post?.title ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags ?? []);
  const [bodyHtml, setBodyHtml] = useState(post?.contentHtml ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (isEditing) {
      if (editorRef.current) {
        editorRef.current.innerHTML = post?.contentHtml ?? "";
      }

      return;
    }

    const timeoutId = window.setTimeout(() => {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);

      if (!rawDraft) {
        return;
      }

      try {
        const draft = JSON.parse(rawDraft) as Partial<DraftPost>;

        setTitle(draft.title ?? "");
        setSelectedTags(draft.tags?.filter((tag) => tags.includes(tag)) ?? []);
        setBodyHtml(draft.bodyHtml ?? "");

        if (editorRef.current) {
          editorRef.current.innerHTML = draft.bodyHtml ?? "";
        }
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isEditing, post?.contentHtml, tags]);

  function saveRange() {
    const range = getSelectionRange();

    if (!range || !editorRef.current) {
      return;
    }

    const commonAncestor = range.commonAncestorContainer;

    if (editorRef.current.contains(commonAncestor)) {
      savedRangeRef.current = range;
    }
  }

  function restoreRange() {
    const range = savedRangeRef.current;
    const selection = window.getSelection();

    if (!range || !selection) {
      editorRef.current?.focus();
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function syncBodyHtml() {
    saveRange();
  }

  function runCommand(command: string, value?: string) {
    restoreRange();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncBodyHtml();
  }

  function applyTextColor(value: (typeof colorOptions)[number]["value"]) {
    restoreRange();

    const selection = window.getSelection();
    const editor = editorRef.current;

    if (!selection || selection.rangeCount === 0 || !editor) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const span = document.createElement("span");
    span.dataset.postColor = value;

    span.appendChild(range.extractContents());
    range.insertNode(span);

    const nextRange = document.createRange();
    nextRange.setStartAfter(span);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange;
    editor.focus();
    syncBodyHtml();
  }

  function applyLink() {
    saveRange();
    const url = window.prompt("링크 주소를 입력해주세요.", "https://");
    const href = normalizeLinkUrl(url);

    if (!href) {
      return;
    }

    restoreRange();

    const selection = window.getSelection();
    const editor = editorRef.current;

    if (!selection || selection.rangeCount === 0 || !editor) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.appendChild(range.extractContents());
    range.insertNode(link);

    const nextRange = document.createRange();
    nextRange.setStartAfter(link);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange;
    editor.focus();
    syncBodyHtml();
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function handleSaveDraft() {
    if (isEditing) {
      return;
    }

    const draft: DraftPost = {
      bodyHtml: editorRef.current?.innerHTML ?? bodyHtml,
      tags: selectedTags,
      title: title.trim(),
    };

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setStatus("임시 저장했습니다.");
  }

  function handleClearDraft() {
    if (!isEditing) {
      window.localStorage.removeItem(DRAFT_KEY);
    }

    setTitle("");
    setSelectedTags([]);
    setBodyHtml("");
    setStatus(isEditing ? "입력값을 비웠습니다." : "초안을 비웠습니다.");

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
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
            contentHtml: editorRef.current?.innerHTML ?? bodyHtml,
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

      window.localStorage.removeItem(DRAFT_KEY);

      if (post) {
        router.replace("/admin/posts");
        router.refresh();
        return;
      }

      setStatus("발행했습니다.");
      router.replace(`/admin/posts/${result.post?.slug ?? ""}`);
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
    if (!post || !window.confirm("이 글을 삭제할까요?")) {
      return;
    }

    setIsDeleting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/posts/${post.slug}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "글을 삭제하지 못했습니다.");
      }

      router.replace("/admin/posts");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "글을 삭제하지 못했습니다.",
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
        <div className="flex flex-wrap items-center gap-2 border-y border-black/10 py-3 dark:border-white/15">
          <button
            type="button"
            title="굵게"
            aria-label="굵게"
            className="grid size-8 place-items-center rounded-md border border-black/10 font-bold text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("bold")}
          >
            B
          </button>
          <button
            type="button"
            title="기울임"
            aria-label="기울임"
            className="grid size-8 place-items-center rounded-md border border-black/10 italic text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("italic")}
          >
            I
          </button>
          <button
            type="button"
            title="밑줄"
            aria-label="밑줄"
            className="grid size-8 place-items-center rounded-md border border-black/10 text-black underline transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("underline")}
          >
            U
          </button>

          <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              aria-label={color.label}
              className="grid size-8 place-items-center rounded-md border border-black/10 transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:hover:border-white/35"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTextColor(color.value)}
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: color.swatch }}
              />
            </button>
          ))}

          <button
            type="button"
            className="h-8 rounded-md border border-black/10 px-2 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
            onMouseDown={(event) => event.preventDefault()}
            onClick={applyLink}
          >
            Link
          </button>

          <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

          {alignmentOptions.map(([command, label, text]) => (
            <button
              key={command}
              type="button"
              title={label}
              aria-label={label}
              className="grid size-8 place-items-center rounded-md border border-black/10 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(command)}
            >
              {text}
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          role="textbox"
          aria-label="본문 편집기"
          contentEditable
          suppressContentEditableWarning
          className="article min-h-72 rounded-md border border-black/10 bg-transparent px-4 py-3 text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35"
          onBlur={saveRange}
          onInput={saveRange}
          onKeyUp={saveRange}
          onMouseUp={saveRange}
        />
      </section>

      {status ? (
        <p className="text-sm text-black/45 dark:text-white/45">{status}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {post ? (
          <button
            type="button"
            disabled={isDeleting}
            className="h-9 rounded-md px-3 text-sm text-red-600 transition-colors duration-300 ease-in-out hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
            onClick={handleDelete}
          >
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
        ) : (
          <button
            type="button"
            className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
            onClick={handleSaveDraft}
          >
            임시 저장
          </button>
        )}
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
