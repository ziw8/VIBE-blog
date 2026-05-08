"use client";

import Link from "next/link";
import { useBlogView } from "@/components/blog-view-provider";

export function HomeTagLink({ tag }: { tag: string }) {
  const { setBlogView, setTargetTag } = useBlogView();

  return (
    <Link
      href="/blog"
      onClick={() => {
        setBlogView("tags");
        setTargetTag(tag);
      }}
      className="inline-block text-current transition-colors duration-300 ease-in-out hover:text-black hover:underline hover:decoration-black/25 hover:underline-offset-2 dark:hover:text-white dark:hover:decoration-white/50"
    >
      {tag}
    </Link>
  );
}
