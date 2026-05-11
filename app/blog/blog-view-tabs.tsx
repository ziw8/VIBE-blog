"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import type { BlogView } from "@/components/blog-view-provider";
import { useBlogView } from "@/components/blog-view-provider";
import { Reveal } from "@/components/reveal";
import type { BlogPostListItem } from "@/lib/posts";
import {
  cn,
  formatCompactDate,
  getTagSectionId,
  groupByYear,
} from "@/lib/utils";

function groupByTag(posts: BlogPostListItem[]) {
  return posts.reduce<Record<string, BlogPostListItem[]>>((groups, post) => {
    post.tags.forEach((tag) => {
      groups[tag] = [...(groups[tag] ?? []), post];
    });

    return groups;
  }, {});
}

function postModifiedTime(post: BlogPostListItem) {
  return new Date(post.updatedAt ?? `${post.date}T00:00:00`).valueOf();
}

function getLatestTagTime(posts: BlogPostListItem[]) {
  return Math.max(...posts.map(postModifiedTime));
}

function TabButton({
  view,
  active,
  onSelect,
  children,
}: {
  view: BlogView;
  active: boolean;
  onSelect: (view: BlogView) => void;
  children: ReactNode;
}) {
  return (
    <button
      id={`${view}-tab`}
      type="button"
      role="tab"
      aria-controls={`${view}-panel`}
      aria-selected={active}
      onClick={() => onSelect(view)}
      className={cn(
        "inline-block cursor-pointer bg-transparent p-0 text-left transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white",
        active
          ? "font-semibold text-black underline decoration-black underline-offset-2 dark:text-white dark:decoration-white"
          : "text-current",
      )}
    >
      {children}
    </button>
  );
}

function BlogViewPostRow({
  post,
  meta,
}: {
  post: BlogPostListItem;
  meta?: ReactNode;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex min-h-9 items-center justify-between gap-4 rounded-lg py-1.5 transition-colors duration-300 ease-in-out"
    >
      <span className="min-w-0 flex-1 truncate pr-4 text-black/75 transition-colors duration-300 ease-in-out group-hover:text-black group-hover:underline group-hover:decoration-black/25 dark:text-white/90 dark:group-hover:text-white dark:group-hover:decoration-white/50">
        {post.title}
      </span>
      <span className="shrink-0 text-sm text-black/40 dark:text-white/40">
        {meta ?? post.tags.join(" / ")}
      </span>
    </Link>
  );
}

export function BlogViewTabs({ posts }: { posts: BlogPostListItem[] }) {
  const {
    blogView: selectedView,
    targetTag,
    setBlogView: setSelectedView,
  } = useBlogView();
  const isTagsView = selectedView === "tags";
  const groupedPosts = groupByYear(posts);
  const groupedTags = Object.fromEntries(
    Object.entries(groupByTag(posts)).map(([tag, tagPosts]) => [
      tag,
      [...tagPosts].sort(
        (a, b) => postModifiedTime(b) - postModifiedTime(a),
      ),
    ]),
  );
  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a));
  const tags = Object.keys(groupedTags).sort((a, b) => {
    const latestDiff =
      getLatestTagTime(groupedTags[b]) - getLatestTagTime(groupedTags[a]);

    return latestDiff || a.localeCompare(b);
  });

  useEffect(() => {
    if (!isTagsView || !targetTag) {
      return;
    }

    window.requestAnimationFrame(() => {
      document
        .getElementById(getTagSectionId(targetTag))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isTagsView, targetTag]);

  return (
    <div className="space-y-10">
      <Reveal>
        <div aria-label="Post views" className="flex gap-4" role="tablist">
          <TabButton
            view="posts"
            active={!isTagsView}
            onSelect={setSelectedView}
          >
            Posts
          </TabButton>
          <TabButton view="tags" active={isTagsView} onSelect={setSelectedView}>
            Tags
          </TabButton>
        </div>
      </Reveal>

      <div
        id={`${selectedView}-panel`}
        role="tabpanel"
        aria-labelledby={`${selectedView}-tab`}
        className="space-y-8"
      >
        {!isTagsView
          ? years.map((year, index) => (
              <Reveal key={year} delay={120 + index * 100}>
                <section className="space-y-2">
                  <h2 className="font-semibold text-black dark:text-white">
                    {year}
                  </h2>
                  <ul className="flex flex-col">
                    {groupedPosts[year].map((post) => (
                      <li key={post.slug}>
                        <BlogViewPostRow post={post} />
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ))
          : tags.map((tag, index) => (
              <Reveal key={tag} delay={120 + index * 100}>
                <section
                  id={getTagSectionId(tag)}
                  className="scroll-mt-28 space-y-2"
                >
                  <h2 className="font-semibold text-black dark:text-white">
                    {tag}
                  </h2>
                  <ul className="flex flex-col">
                    {groupedTags[tag].map((post) => (
                      <li key={post.slug}>
                        <BlogViewPostRow
                          post={post}
                          meta={formatCompactDate(post.date)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ))}
      </div>
    </div>
  );
}
