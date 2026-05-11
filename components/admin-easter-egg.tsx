"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const ADMIN_TRIGGER = "::admin";

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

export function AdminEasterEgg() {
  const pathname = usePathname();
  const router = useRouter();
  const buffer = useRef("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1 ||
        isTypingTarget(event.target) ||
        pathname.startsWith("/admin")
      ) {
        return;
      }

      buffer.current = `${buffer.current}${event.key}`.slice(
        -ADMIN_TRIGGER.length,
      );

      if (buffer.current === ADMIN_TRIGGER) {
        buffer.current = "";
        router.push("/admin/login");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return null;
}
