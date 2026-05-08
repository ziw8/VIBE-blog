"use client";

import { useRouter } from "next/navigation";

export function BackLink({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:text-black hover:decoration-black/25 dark:decoration-white/30 dark:hover:text-white dark:hover:decoration-white/50"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <span aria-hidden="true">{"<-"}</span>
      블로그로 돌아가기
    </button>
  );
}
