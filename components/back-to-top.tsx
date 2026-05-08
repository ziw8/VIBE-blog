"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="맨 위로"
      title="맨 위로"
      className={cn(
        "grid size-8 place-items-center rounded-full transition-all duration-300 ease-in-out hover:text-black dark:hover:text-white",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUpIcon />
    </button>
  );
}
