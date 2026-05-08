import NextLink from "next/link";
import type { BlogPost } from "@/lib/posts";

export function ArrowCard({ post }: { post: BlogPost }) {
  return (
    <NextLink
      href={`/blog/${post.slug}`}
      className="group relative flex min-h-20 flex-nowrap rounded-lg border border-black/15 px-4 py-3 pr-10 transition-colors duration-300 ease-in-out hover:bg-black/5 hover:text-black dark:border-white/20 dark:hover:bg-white/5 dark:hover:text-white"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-black dark:text-white">
          {post.title}
        </span>
        <span className="line-clamp-2 text-sm">{post.description}</span>
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="absolute right-2 top-1/2 size-5 -translate-y-1/2 fill-none stroke-current stroke-2"
      >
        <line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
          className="origin-left translate-x-3 scale-x-0 transition-transform duration-300 ease-in-out group-hover:translate-x-0 group-hover:scale-x-100"
        />
        <polyline
          points="12 5 19 12 12 19"
          className="-translate-x-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0"
        />
      </svg>
    </NextLink>
  );
}
