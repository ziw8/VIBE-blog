"use client";

import Link from "next/link";
import { useState } from "react";
import { cn, formatCompactDate, getPostPath } from "@/lib/utils";

type ManagedPost = {
  date: string;
  slug: string;
  title: string;
};

type ManagedDraft = {
  id: string;
  title: string;
  updatedAt: string;
};

type AdminPostsTabsProps = {
  drafts: ManagedDraft[];
  posts: ManagedPost[];
};

function formatCompactDateTime(value: string) {
  const date = new Date(value);
  const year = String(date.getFullYear()).slice(-2);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}.${month}.${day}`;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "bg-transparent p-0 text-left transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white",
        active
          ? "font-semibold text-black underline decoration-black underline-offset-2 dark:text-white dark:decoration-white"
          : "text-black/55 dark:text-white/55",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AdminPostsTabs({ drafts, posts }: AdminPostsTabsProps) {
  const [activeView, setActiveView] = useState<"published" | "drafts">(
    "published",
  );
  const isPublished = activeView === "published";

  return (
    <section className="space-y-5">
      <div className="flex gap-4">
        <TabButton
          active={isPublished}
          onClick={() => setActiveView("published")}
        >
          게시된 글
        </TabButton>
        <TabButton
          active={!isPublished}
          onClick={() => setActiveView("drafts")}
        >
          임시저장된 글
        </TabButton>
      </div>

      {isPublished ? (
        <ul className="flex flex-col">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={getPostPath("/admin/posts", post.slug)}
                className="group flex min-h-9 items-center justify-between gap-4 rounded-lg py-1.5 transition-colors duration-300 ease-in-out"
              >
                <span className="min-w-0 flex-1 truncate pr-4 text-black/75 transition-colors duration-300 ease-in-out group-hover:text-black group-hover:underline group-hover:decoration-black/25 dark:text-white/90 dark:group-hover:text-white dark:group-hover:decoration-white/50">
                  {post.title}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm text-black/40 dark:text-white/40">
                  <span>수정/삭제</span>
                  {formatCompactDate(post.date)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/admin/posts/drafts/${draft.id}`}
                className="group flex min-h-9 items-center justify-between gap-4 rounded-lg py-1.5 transition-colors duration-300 ease-in-out"
              >
                <span className="min-w-0 flex-1 truncate pr-4 text-black/75 transition-colors duration-300 ease-in-out group-hover:text-black group-hover:underline group-hover:decoration-black/25 dark:text-white/90 dark:group-hover:text-white dark:group-hover:decoration-white/50">
                  {draft.title || "제목 없음"}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm text-black/40 dark:text-white/40">
                  <span>임시저장</span>
                  {formatCompactDateTime(draft.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
          {drafts.length === 0 ? (
            <li className="border-t border-black/10 py-3 text-sm text-black/45 dark:border-white/15 dark:text-white/45">
              임시저장된 글이 없습니다.
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
