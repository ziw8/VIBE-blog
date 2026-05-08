import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogPost } from "@/lib/posts";

type PostRowPost = Pick<BlogPost, "slug" | "title" | "tags">;

export function PostRow({
  post,
  meta,
}: {
  post: PostRowPost;
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
