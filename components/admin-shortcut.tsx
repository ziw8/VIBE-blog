"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function AdminShortcut() {
  const pathname = usePathname();
  const router = useRouter();
  const checking = useRef(false);

  useEffect(() => {
    async function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "q" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        checking.current ||
        pathname === "/admin"
      ) {
        return;
      }

      checking.current = true;

      try {
        const response = await fetch("/api/admin/status", {
          cache: "no-store",
        });
        const data = (await response.json()) as { isAdmin?: boolean };

        if (data.isAdmin) {
          router.push("/admin");
        }
      } finally {
        checking.current = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return null;
}
